#define _WIN32_WINNT 0x0A00
#define NOMINMAX
#include <windows.h>
#include <bcrypt.h>
#include <winhttp.h>
#include <httplib.h>
#include <sqlite3.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <queue>
#include <set>
#include <mutex>
#include <algorithm>
#include <ctime>
#include <cmath>
using namespace std;
using json=nlohmann::json;
sqlite3* db=nullptr;
mutex dbMutex;
string trim(string s){auto b=s.find_first_not_of(" \r\n\t");return b==string::npos?"":s.substr(b,s.find_last_not_of(" \r\n\t")-b+1);}
string lower(string s){for(auto &c:s)c=tolower((unsigned char)c);return s;}
string env(const char* k){auto v=getenv(k);return v?v:"";}
long long now(){return time(nullptr);}
string day(){time_t t=time(nullptr);tm x;gmtime_s(&x,&t);char s[20];strftime(s,sizeof(s),"%Y-%m-%d",&x);return s;}
string hex(const vector<unsigned char>& b){string s;for(auto c:b){s+="0123456789abcdef"[c>>4];s+="0123456789abcdef"[c&15];}return s;}
string randomToken(){vector<unsigned char>b(32);if(BCryptGenRandom(nullptr,b.data(),(ULONG)b.size(),BCRYPT_USE_SYSTEM_PREFERRED_RNG)<0)throw runtime_error("Random generator failed");return hex(b);}
string digest(string text,string salt="",bool password=false){BCRYPT_ALG_HANDLE a=nullptr;vector<unsigned char> out(32);NTSTATUS rc=BCryptOpenAlgorithmProvider(&a,BCRYPT_SHA256_ALGORITHM,nullptr,password?BCRYPT_ALG_HANDLE_HMAC_FLAG:0);if(rc<0)throw runtime_error("Crypto provider failed");if(password)rc=BCryptDeriveKeyPBKDF2(a,(PUCHAR)text.data(),(ULONG)text.size(),(PUCHAR)salt.data(),(ULONG)salt.size(),210000,out.data(),32,0);else rc=BCryptHash(a,nullptr,0,(PUCHAR)text.data(),(ULONG)text.size(),out.data(),32);BCryptCloseAlgorithmProvider(a,0);if(rc<0)throw runtime_error("Hash failed");return hex(out);}
bool equalSecret(string a,string b){unsigned x=(unsigned)(a.size()^b.size());for(size_t i=0;i<max(a.size(),b.size());i++)x|=(i<a.size()?a[i]:0)^(i<b.size()?b[i]:0);return x==0;}
bool strong(string s){bool a=0,b=0,c=0,d=0;for(unsigned char x:s){a|=islower(x)!=0;b|=isupper(x)!=0;c|=isdigit(x)!=0;d|=!isalnum(x);}return s.size()>=12&&s.size()<=128&&a&&b&&c&&d;}
json query(string sql,json args=json::array()) {sqlite3_stmt*st=nullptr;if(sqlite3_prepare_v2(db,sql.c_str(),-1,&st,nullptr)!=SQLITE_OK)throw runtime_error(sqlite3_errmsg(db));struct Guard{sqlite3_stmt*s;~Guard(){sqlite3_finalize(s);}}guard{st};for(size_t i=0;i<args.size();i++){auto &v=args[i];int rc;if(v.is_number_integer())rc=sqlite3_bind_int64(st,(int)i+1,v.get<long long>());else{string s=v.is_string()?v.get<string>():v.dump();rc=sqlite3_bind_text(st,(int)i+1,s.c_str(),-1,SQLITE_TRANSIENT);}if(rc!=SQLITE_OK)throw runtime_error("Binding failed");}json rows=json::array();int rc;while((rc=sqlite3_step(st))==SQLITE_ROW){json row=json::object();for(int i=0;i<sqlite3_column_count(st);i++){string k=sqlite3_column_name(st,i);if(sqlite3_column_type(st,i)==SQLITE_INTEGER)row[k]=sqlite3_column_int64(st,i);else {const char*p=(const char*)sqlite3_column_text(st,i);row[k]=p?p:"";}}rows.push_back(row);}if(rc!=SQLITE_DONE)throw runtime_error(sqlite3_errmsg(db));return rows;}
void sql(string s){char*e=nullptr;if(sqlite3_exec(db,s.c_str(),nullptr,nullptr,&e)!=SQLITE_OK){string m=e?e:"Database failure";sqlite3_free(e);throw runtime_error(m);}}
struct Transaction{bool done=false;Transaction(){sql("BEGIN IMMEDIATE");}void commit(){sql("COMMIT");done=true;}~Transaction(){if(!done)sqlite3_exec(db,"ROLLBACK",nullptr,nullptr,nullptr);}};
struct ApiError:runtime_error{int status;ApiError(int s,string m):runtime_error(m),status(s){}};
void require(bool condition,string message,int status=400){if(!condition)throw ApiError(status,message);}
string field(json b,string k){require(b.is_object()&&b.contains(k)&&b[k].is_string(),"Missing or invalid "+k);return trim(b[k].get<string>());}
bool mail(string e){auto at=e.find('@');return e.size()<=254&&at>0&&at!=string::npos&&e.find('.',at)!=string::npos&&e.find_first_of(" \r\n\t")==string::npos;}
bool phone(string p){return p.size()>=9&&p.size()<=16&&p[0]=='+'&&all_of(p.begin()+1,p.end(),[](char c){return isdigit((unsigned char)c);});}
wstring wide(string s){int n=MultiByteToWideChar(CP_UTF8,0,s.data(),(int)s.size(),nullptr,0);wstring w(n,0);MultiByteToWideChar(CP_UTF8,0,s.data(),(int)s.size(),w.data(),n);return w;}
bool delivery(json payload){string endpoint=env("CAREERPULSE_DELIVERY_URL");if(endpoint.empty())return false;require(endpoint.rfind("https://",0)==0,"Delivery webhook must use HTTPS",503);wstring u=wide(endpoint);URL_COMPONENTS c{};c.dwStructSize=sizeof(c);c.dwHostNameLength=c.dwUrlPathLength=c.dwExtraInfoLength=(DWORD)-1;require(WinHttpCrackUrl(u.c_str(),0,0,&c),"Invalid delivery URL",503);wstring host(c.lpszHostName,c.dwHostNameLength),path(c.lpszUrlPath,c.dwUrlPathLength);if(c.dwExtraInfoLength)path+=wstring(c.lpszExtraInfo,c.dwExtraInfoLength);auto session=WinHttpOpen(L"CareerPulse/1.0",WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,nullptr,nullptr,0);require(session!=nullptr,"Delivery unavailable",503);WinHttpSetTimeouts(session,4000,4000,4000,6000);auto conn=WinHttpConnect(session,host.c_str(),c.nPort,0);auto req=conn?WinHttpOpenRequest(conn,L"POST",path.c_str(),nullptr,WINHTTP_NO_REFERER,WINHTTP_DEFAULT_ACCEPT_TYPES,WINHTTP_FLAG_SECURE):nullptr;string data=payload.dump();wstring headers=L"Content-Type: application/json\r\nAuthorization: Bearer "+wide(env("CAREERPULSE_DELIVERY_SECRET"))+L"\r\n";bool ok=req&&WinHttpSendRequest(req,headers.c_str(),(DWORD)-1,data.data(),(DWORD)data.size(),(DWORD)data.size(),0)&&WinHttpReceiveResponse(req,nullptr);DWORD status=0,len=sizeof(status);if(ok)ok=WinHttpQueryHeaders(req,WINHTTP_QUERY_STATUS_CODE|WINHTTP_QUERY_FLAG_NUMBER,nullptr,&status,&len,nullptr)&&status>=200&&status<300;if(req)WinHttpCloseHandle(req);if(conn)WinHttpCloseHandle(conn);WinHttpCloseHandle(session);require(ok,"Message delivery failed. Please retry later.",503);return true;}
bool dev(){return env("CAREERPULSE_DELIVERY_URL").empty()&&env("CAREERPULSE_PRODUCTION")!="1";}
void sendCode(string purpose,string destination,string code){if(dev()){cout<<"LOCAL TEST "<<purpose<<" for "<<destination<<": "<<code<<endl;return;}require(!env("CAREERPULSE_DELIVERY_URL").empty(),"SMS/email delivery has not been configured",503);delivery({{"purpose",purpose},{"destination",destination},{"code",code},{"expiresIn",600}});}
string cookieValue(const httplib::Request&r,string key){string all=r.get_header_value("Cookie");size_t start=0;while(start<all.size()){auto end=all.find(';',start);auto part=trim(all.substr(start,end==string::npos?end:end-start));if(part.rfind(key+"=",0)==0)return part.substr(key.size()+1);if(end==string::npos)break;start=end+1;}return "";}
void cookie(httplib::Response&r,string token,bool remove=false){r.set_header("Set-Cookie","cp_session="+token+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+(remove?string("0"):string("28800"))+(env("CAREERPULSE_PRODUCTION")=="1"?"; Secure":""));}
json publicUser(json u){return {{"id",u["id"]},{"username",u["username"]},{"email",u["email"]},{"phone",u["phone"]},{"personal",json::parse(u["personal"].get<string>())},{"career",u["career"]},{"setup",u["setup"]}};}
void newSession(int id,httplib::Response&r){string t=randomToken();query("INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)",{digest(t),id,now()+28800});cookie(r,t);}
json user(const httplib::Request&r){string t=cookieValue(r,"cp_session");auto rows=query("SELECT a.* FROM accounts a JOIN sessions s ON s.user_id=a.id WHERE s.token=? AND s.expires>?",{digest(t),now()});require(!rows.empty(),"Please sign in to continue",401);return rows[0];}
void limited(string key,int maximum,int seconds){query("DELETE FROM limits WHERE expires<?",{now()});auto a=query("SELECT * FROM limits WHERE key=?",{key});if(!a.empty())require(a[0]["hits"].get<int>()<maximum,"Too many attempts. Please try again later.",429);query("INSERT INTO limits(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1",{key,now()+seconds});}
struct Skill {
    int id;
    string name;
    string category;
    int importance;
};

struct Career {
    string name;
    vector<int> requiredSkills;
};

const vector<Skill> SKILLS = {
    {1,"C++ Fundamentals","Programming",5},
    {2,"Data Structures","DSA",5},
    {3,"Algorithms","DSA",5},
    {4,"OOP","Programming",4},
    {5,"DBMS and SQL","Database",4},
    {6,"Operating Systems","Core CS",3},
    {7,"Computer Networks","Core CS",3},
    {8,"Python","Programming",4},
    {9,"Linear Algebra","Mathematics",3},
    {10,"Statistics and Probability","Mathematics",4},
    {11,"Machine Learning","AI/ML",5},
    {12,"Deep Learning","AI/ML",4},
    {13,"Data Analysis","Data",5},
    {14,"Git and GitHub","Tools",3},
    {15,"Problem Solving","DSA",5}
};

const vector<Career> CAREERS = {
    {"Software Developer",{1,2,3,4,5,6,7,14,15}},
    {"AI/ML Engineer",{1,2,3,8,9,10,11,12,14,15}},
    {"Data Analyst",{5,8,10,13,14,15}},
    {"Competitive Programmer",{1,2,3,15}}
};

const vector<pair<int,int>> PREREQUISITES = {
    {1,2},{1,4},{2,3},{2,15},{8,11},{9,11},{10,11},{11,12},
    {5,13},{10,13},{1,14}
};


json problems(){int n=0;for(char c:day())n+=c;int x=10+n%30;return json::array({
{{"id",1},{"title","Array warm-up"},{"topic","Arrays"},{"difficulty","Easy"},{"statement","Find the sum of [4, 7, "+to_string(x)+", 9]. Submit the integer."},{"answer",to_string(20+x)}},
{{"id",2},{"title","Binary search trace"},{"topic","Searching"},{"difficulty","Easy"},{"statement","In [2, 5, 8, 12, 16, 23, 38], what is the zero-based index of 16?"},{"answer","4"}},
{{"id",3},{"title","Stack detective"},{"topic","Stacks"},{"difficulty","Easy"},{"statement","Push 3, push 8, pop, push 5, push 9, pop. What value is now on top?"},{"answer","5"}},
{{"id",4},{"title","Follow the queue"},{"topic","Graphs"},{"difficulty","Medium"},{"statement","BFS from A. Edges: A-B, A-C, B-D, C-E. Visit neighbors alphabetically. Enter traversal letters without spaces."},{"answer","abcde"}},
{{"id",5},{"title","Shortest route"},{"topic","Graphs"},{"difficulty","Medium"},{"statement","Undirected edges: A-B=4, A-C=2, C-B=1, B-D=5, C-D=8. What is the shortest distance from A to D?"},{"answer","8"}},
{{"id",6},{"title","Dynamic programming step"},{"topic","DP"},{"difficulty","Medium"},{"statement","You may climb 1 or 2 stairs per step. How many distinct ordered ways can you climb 6 stairs?"},{"answer","13"}}
});}
json quiz(int id){static vector<json> qs={
{{"q","Which declaration stores an integer in C++?"},{"options",{"int x = 3;","text x = 3;","integer(x);"}},{"answer",0}},
{{"q","Which structure follows FIFO?"},{"options",{"Stack","Queue","Tree"}},{"answer",1}},
{{"q","Binary search on a sorted array takes which time?"},{"options",{"O(n)","O(n²)","O(log n)"}},{"answer",2}},
{{"q","Which concept hides implementation details?"},{"options",{"Abstraction","Iteration","Sorting"}},{"answer",0}},
{{"q","Which SQL clause filters rows before grouping?"},{"options",{"ORDER BY","WHERE","HAVING"}},{"answer",1}},
{{"q","A deadlock requires processes waiting for what?"},{"options",{"The compiler","The browser","Resources held by one another"}},{"answer",2}},
{{"q","Which protocol provides reliable ordered transport?"},{"options",{"TCP","UDP","IP alone"}},{"answer",0}},
{{"q","Which Python collection has unique elements?"},{"options",{"list","set","tuple"}},{"answer",1}},
{{"q","What is the dot product of [1,2] and [3,4]?"},{"options",{"7","10","11"}},{"answer",2}},
{{"q","What is the mean of 2, 4 and 6?"},{"options",{"4","6","12"}},{"answer",0}},
{{"q","Training on labeled examples is called what?"},{"options",{"Clustering","Supervised learning","Compression"}},{"answer",1}},
{{"q","Backpropagation primarily computes what?"},{"options",{"SQL indexes","Network packets","Loss gradients"}},{"answer",2}},
{{"q","What should you check before interpreting a dataset?"},{"options",{"Missing values and data quality","Only its filename","Only its row count"}},{"answer",0}},
{{"q","Which Git command records staged changes?"},{"options",{"git fetch","git commit","git status"}},{"answer",1}},
{{"q","What should you clarify before choosing an algorithm?"},{"options",{"Editor theme","Logo color","Inputs, constraints and expected output"}},{"answer",2}}
};return qs.at(id-1);}
const Career* careerFor(string n){for(auto&c:CAREERS)if(c.name==n)return &c;return nullptr;}
json stats(int id,string career){auto c=careerFor(career);json result={{"completed",0},{"total",c?(int)c->requiredSkills.size():0},{"solved",0},{"minutes",0},{"pace",0},{"estimate",nullptr},{"history",json::array()}};auto rows=query("SELECT skill_id FROM completed WHERE user_id=?",{id});result["completed"]=(int)rows.size();result["solved"]=query("SELECT COUNT(*) n FROM attempts WHERE user_id=? AND solved=1",{id})[0]["n"];auto h=query("SELECT substr(date,1,10) date,COUNT(*) count,SUM(seconds) seconds FROM completed WHERE user_id=? GROUP BY date ORDER BY date",{id});result["history"]=h;long long sec=0;for(auto &r:h)sec+=r["seconds"].get<long long>();result["minutes"]=sec/60;if(rows.size()>=3){auto first=query("SELECT MIN(finished) first FROM completed WHERE user_id=?",{id})[0]["first"].get<long long>();double days=max(1.0,(now()-first)/86400.0);double pace=rows.size()/days*7;result["pace"]=round(pace*10)/10;int remain=max(0,result["total"].get<int>()-(int)rows.size());result["estimate"]={{"minWeeks",(int)ceil(remain/pace)},{"maxWeeks",(int)ceil(remain/pace*1.5)}};}return result;}
json handle(const httplib::Request&r,httplib::Response&res){string p=r.path;bool post=r.method=="POST";json b=json::object();if(post){try{b=json::parse(r.body);}catch(...){throw ApiError(400,"Invalid JSON request");}require(b.is_object(),"Expected a JSON object");}
query("DELETE FROM sessions WHERE expires<?",{now()});query("DELETE FROM pending WHERE expires<?",{now()});
if(p=="/api/health")return {{"status","CareerPulse API is running"},{"developmentDelivery",dev()}};
if(p=="/api/catalog"){json skills=json::array(),careers=json::array();for(auto&s:SKILLS)skills.push_back({{"id",s.id},{"name",s.name},{"category",s.category}});for(auto&c:CAREERS)careers.push_back({{"name",c.name},{"skills",c.requiredSkills}});return {{"skills",skills},{"careers",careers}};}
if(p=="/api/auth/register"&&post){limited("register:"+r.remote_addr,8,600);string username=lower(field(b,"username")),email=lower(field(b,"email")),ph=field(b,"phone"),pw=field(b,"password");require(username.size()>=3&&username.size()<=30&&all_of(username.begin(),username.end(),[](char c){return isalnum((unsigned char)c)||c=='_';}),"Username: use 3–30 letters, numbers or underscores");require(mail(email)&&phone(ph),"Enter a valid email and phone with country code");require(strong(pw),"Use 12–128 characters with uppercase, lowercase, a number and a symbol");require(query("SELECT id FROM accounts WHERE username=? OR email=? OR phone=?",{username,email,ph}).empty(),"Username, email or phone is already registered",409);string salt=randomToken(),code=to_string(100000+stoul(randomToken().substr(0,6),nullptr,16)%900000),ticket=randomToken();sendCode("phone_verification",ph,code);query("INSERT INTO pending(ticket,data,code,expires,attempts,sent) VALUES(?,?,?,?,0,?)",{ticket,json({{"username",username},{"email",email},{"phone",ph},{"salt",salt},{"hash",digest(pw,salt,true)}}).dump(),digest(code),now()+600,now()});json out={{"ticket",ticket},{"development",dev()},{"expiresIn",600}};if(dev())out["developmentCode"]=code;return out;}
if(p=="/api/auth/resend"&&post){string ticket=field(b,"ticket");auto a=query("SELECT * FROM pending WHERE ticket=? AND expires>?",{ticket,now()});require(!a.empty(),"Verification expired. Register again");require(now()-a[0]["sent"].get<long long>()>=60,"Wait 60 seconds before requesting a new code",429);limited("resend:"+r.remote_addr,5,600);string code=to_string(100000+stoul(randomToken().substr(0,6),nullptr,16)%900000);auto data=json::parse(a[0]["data"].get<string>());sendCode("phone_verification",data["phone"],code);query("UPDATE pending SET code=?,expires=?,attempts=0,sent=? WHERE ticket=?",{digest(code),now()+600,now(),ticket});json out={{"development",dev()}};if(dev())out["developmentCode"]=code;return out;}
if(p=="/api/auth/verify"&&post){string ticket=field(b,"ticket");auto a=query("SELECT * FROM pending WHERE ticket=? AND expires>?",{ticket,now()});require(!a.empty(),"Verification expired. Register again");require(a[0]["attempts"].get<int>()<5,"Too many incorrect codes. Request a new code",429);query("UPDATE pending SET attempts=attempts+1 WHERE ticket=?",{ticket});require(equalSecret(digest(field(b,"code")),a[0]["code"]),"Incorrect verification code");auto v=json::parse(a[0]["data"].get<string>());Transaction tx;require(query("SELECT id FROM accounts WHERE username=? OR email=? OR phone=?",{v["username"],v["email"],v["phone"]}).empty(),"Account already registered",409);query("INSERT INTO accounts(username,email,phone,salt,hash) VALUES(?,?,?,?,?)",{v["username"],v["email"],v["phone"],v["salt"],v["hash"]});int id=(int)sqlite3_last_insert_rowid(db);query("DELETE FROM pending WHERE ticket=?",{ticket});newSession(id,res);tx.commit();return publicUser(query("SELECT * FROM accounts WHERE id=?",{id})[0]);}
if(p=="/api/auth/login"&&post){limited("login:"+r.remote_addr,15,600);string name=lower(field(b,"username")),pw=field(b,"password");require(pw.size()<=128,"Invalid credentials",401);auto a=query("SELECT * FROM accounts WHERE username=? OR email=?",{name,name});string salt=a.empty()?string(64,'0'):a[0]["salt"].get<string>();string hash=digest(pw,salt,true);require(!a.empty()&&equalSecret(hash,a[0]["hash"]),"Incorrect username or password",401);newSession(a[0]["id"],res);return publicUser(a[0]);}
if(p=="/api/auth/forgot"&&post){limited("recovery:"+r.remote_addr,5,600);string email=lower(field(b,"email"));string token=randomToken();auto a=query("SELECT id FROM accounts WHERE email=?",{email});if(!a.empty()){sendCode("password_reset",email,token);query("INSERT INTO resets(token,user_id,expires) VALUES(?,?,?)",{digest(token),a[0]["id"],now()+600});}json out={{"message","If this account exists, a recovery code has been issued."},{"development",dev()}};if(dev()&&!a.empty())out["developmentCode"]=token;return out;}
if(p=="/api/auth/reset-password"&&post){limited("reset:"+r.remote_addr,10,600);auto a=query("SELECT * FROM resets WHERE token=? AND expires>?",{digest(field(b,"code")),now()});require(!a.empty(),"Recovery code is invalid or expired");string pw=field(b,"password");require(strong(pw),"Use a strong password with at least 12 characters");string salt=randomToken();Transaction tx;query("UPDATE accounts SET salt=?,hash=? WHERE id=?",{salt,digest(pw,salt,true),a[0]["user_id"]});query("DELETE FROM sessions WHERE user_id=?",{a[0]["user_id"]});query("DELETE FROM resets WHERE user_id=?",{a[0]["user_id"]});tx.commit();return {{"message","Password updated. Please sign in."}};}
json u=user(r);int id=u["id"];if(post){auto origin=r.get_header_value("Origin");require(origin.empty()||origin=="http://"+r.get_header_value("Host")||origin=="https://"+r.get_header_value("Host"),"Cross-origin write rejected",403);}
if(p=="/api/me")return publicUser(u);
if(p=="/api/auth/logout"&&post){query("DELETE FROM sessions WHERE token=?",{digest(cookieValue(r,"cp_session"))});cookie(res,"",true);return {{"ok",true}};}
if(p=="/api/personal"&&post){string name=field(b,"name"),college=lower(field(b,"college")),department=field(b,"department"),year=field(b,"year");require(name.size()>=2&&name.size()<=100&&college.size()>=2&&college.size()<=150&&department.size()<=100&&year.size()<=30,"Complete your personal information");json personal={{"name",name},{"college",college},{"department",department},{"year",year}};query("UPDATE accounts SET personal=?,setup=MAX(setup,1) WHERE id=?",{personal.dump(),id});return publicUser(query("SELECT * FROM accounts WHERE id=?",{id})[0]);}
if(p=="/api/career"&&post){require(u["setup"].get<int>()>=1,"Complete personal information first");string name=field(b,"career");require(careerFor(name)!=nullptr,"Choose a supported career");require(u["career"]=="","Use the change career action in settings",409);query("UPDATE accounts SET career=?,setup=2 WHERE id=?",{name,id});return publicUser(query("SELECT * FROM accounts WHERE id=?",{id})[0]);}
auto career=careerFor(u["career"]);if(p=="/api/assessment"&&post){require(career!=nullptr,"Select a career first");require(b.contains("ratings")&&b["ratings"].is_array()&&b["ratings"].size()==career->requiredSkills.size(),"Rate every required skill");set<int>seen;Transaction tx;for(auto&x:b["ratings"]){require(x.contains("skillId")&&x["skillId"].is_number_integer()&&x.contains("level")&&x["level"].is_number_integer(),"Invalid rating");long long s=x["skillId"].get<long long>(),v=x["level"].get<long long>();require(v>=0&&v<=5&&find(career->requiredSkills.begin(),career->requiredSkills.end(),s)!=career->requiredSkills.end()&&seen.insert((int)s).second,"Invalid rating");query("INSERT INTO ratings(user_id,skill_id,level) VALUES(?,?,?) ON CONFLICT(user_id,skill_id) DO UPDATE SET level=excluded.level",{id,s,v});}query("UPDATE accounts SET setup=3 WHERE id=?",{id});tx.commit();return {{"ok",true}};}
if(p=="/api/dashboard"){return {{"user",publicUser(u)},{"stats",stats(id,u["career"])},{"completed",query("SELECT skill_id FROM completed WHERE user_id=?",{id})},{"ratings",query("SELECT skill_id,level FROM ratings WHERE user_id=?",{id})}};}
if(p=="/api/learning/start"&&post){require(career!=nullptr,"Select career first");int s=b.value("skillId",0);require(find(career->requiredSkills.begin(),career->requiredSkills.end(),s)!=career->requiredSkills.end(),"Invalid skill");query("INSERT INTO learning(user_id,skill_id,started) VALUES(?,?,?) ON CONFLICT(user_id,skill_id) DO NOTHING",{id,s,now()});json q=quiz(s);q.erase("answer");return q;}
if(p=="/api/learning/complete"&&post){int s=b.value("skillId",0);require(career&&find(career->requiredSkills.begin(),career->requiredSkills.end(),s)!=career->requiredSkills.end(),"Invalid skill");limited("quiz:"+to_string(id),50,600);auto a=query("SELECT * FROM learning WHERE user_id=? AND skill_id=?",{id,s});require(!a.empty(),"Start the learning check first");require(b.contains("answer")&&b["answer"].is_number_integer()&&b["answer"]==quiz(s)["answer"],"That answer is not correct. Review the concept and try again.");query("INSERT INTO completed(user_id,skill_id,finished,date,seconds) VALUES(?,?,?,?,?) ON CONFLICT(user_id,skill_id) DO NOTHING",{id,s,now(),day(),min(3600LL,max(0LL,now()-a[0]["started"].get<long long>()))});return {{"ok",true}};}
if(p=="/api/problems"){json ps=problems();for(auto &x:ps)x.erase("answer");return {{"problems",ps},{"day",day()},{"attempts",query("SELECT problem_id,started,solved,seconds FROM attempts WHERE user_id=? AND date=?",{id,day()})},{"now",now()}};}
if(p=="/api/problems/start"&&post){int n=b.value("problemId",0);require(n>=1&&n<=6,"Invalid problem");query("INSERT INTO attempts(user_id,problem_id,date,started) VALUES(?,?,?,?) ON CONFLICT(user_id,problem_id,date) DO NOTHING",{id,n,day(),now()});return query("SELECT problem_id,started,solved,seconds FROM attempts WHERE user_id=? AND problem_id=? AND date=?",{id,n,day()})[0];}
if(p=="/api/problems/submit"&&post){limited("answer:"+to_string(id),60,600);int n=b.value("problemId",0);require(n>=1&&n<=6,"Invalid problem");auto a=query("SELECT * FROM attempts WHERE user_id=? AND problem_id=? AND date=?",{id,n,day()});require(!a.empty(),"Start the problem first");require(lower(field(b,"answer"))==problems()[n-1]["answer"],"Incorrect answer. The timer is still running.");query("UPDATE attempts SET solved=1,seconds=? WHERE user_id=? AND problem_id=? AND date=? AND solved=0",{max(1LL,now()-a[0]["started"].get<long long>()),id,n,day()});return {{"ok",true}};}
if(p=="/api/leaderboard"){auto personal=json::parse(u["personal"].get<string>());string college=personal.value("college","");return {{"day",day()},{"college",college},{"verifiedMembership",false},{"rows",query("SELECT a.username,COUNT(*) solved,SUM(t.seconds) seconds FROM attempts t JOIN accounts a ON a.id=t.user_id WHERE t.solved=1 AND t.date=? AND json_extract(a.personal,'$.college')=? GROUP BY a.id ORDER BY solved DESC,seconds ASC,a.username ASC",{day(),college})}};}
if(p=="/api/settings/action"&&post){string action=field(b,"action"),pw=field(b,"password");require(pw.size()<=128&&equalSecret(digest(pw,u["salt"],true),u["hash"]),"Incorrect password",403);require(action=="reset"||action=="career"||action=="delete","Invalid action");string next=action=="career"?field(b,"career"):u["career"].get<string>();if(action=="career")require(careerFor(next)!=nullptr,"Choose a supported career");Transaction tx;if(action=="delete"){query("DELETE FROM accounts WHERE id=?",{id});cookie(res,"",true);}else{for(string table:{"ratings","completed","learning","attempts"})query("DELETE FROM "+table+" WHERE user_id=?",{id});query("UPDATE accounts SET career=?,setup=2 WHERE id=?",{next,id});}tx.commit();return {{"ok",true}};}
throw ApiError(404,"This API route does not exist");}
int main(){try{require(sqlite3_open("careerpulse.db",&db)==SQLITE_OK,"Cannot open CareerPulse database",500);sqlite3_busy_timeout(db,5000);sql(R"(PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,email TEXT UNIQUE NOT NULL,phone TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,personal TEXT NOT NULL DEFAULT '{}',career TEXT NOT NULL DEFAULT '',setup INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,expires INTEGER);
CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,expires INTEGER);
CREATE TABLE IF NOT EXISTS pending(ticket TEXT PRIMARY KEY,data TEXT,code TEXT,expires INTEGER,attempts INTEGER,sent INTEGER);
CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,hits INTEGER,expires INTEGER);
CREATE TABLE IF NOT EXISTS ratings(user_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,skill_id INTEGER,level INTEGER CHECK(level BETWEEN 0 AND 5),PRIMARY KEY(user_id,skill_id));
CREATE TABLE IF NOT EXISTS completed(user_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,skill_id INTEGER,finished INTEGER,date TEXT,seconds INTEGER,PRIMARY KEY(user_id,skill_id));
CREATE TABLE IF NOT EXISTS learning(user_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,skill_id INTEGER,started INTEGER,PRIMARY KEY(user_id,skill_id));
CREATE TABLE IF NOT EXISTS attempts(user_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,problem_id INTEGER,date TEXT,started INTEGER,solved INTEGER DEFAULT 0,seconds INTEGER DEFAULT 0,PRIMARY KEY(user_id,problem_id,date));)");httplib::Server server;server.set_payload_max_length(65536);server.set_default_headers({{"Cache-Control","no-store"},{"X-Content-Type-Options","nosniff"},{"Referrer-Policy","same-origin"}});auto route=[&](const httplib::Request&r,httplib::Response&res){lock_guard<mutex>lock(dbMutex);try{res.set_content(handle(r,res).dump(),"application/json");}catch(const ApiError&e){res.status=e.status;res.set_content(json({{"error",e.what()}}).dump(),"application/json");}catch(const exception&e){cerr<<e.what()<<endl;res.status=500;res.set_content(R"({"error":"Server could not complete the request"})","application/json");}};server.Get(R"(/api/.*)",route);server.Post(R"(/api/.*)",route);require(server.set_mount_point("/","../frontend"),"Keep frontend beside backend",500);int port=env("CAREERPULSE_PORT").empty()?8081:stoi(env("CAREERPULSE_PORT"));cout<<"CareerPulse: http://127.0.0.1:"<<port<<"/\n"<<(dev()?"LOCAL TEST DELIVERY: codes appear in the browser and this console. No SMS/email is sent.\n":"External delivery enabled or required.\n")<<flush;require(server.bind_to_port("127.0.0.1",port),"Port unavailable",500);server.listen_after_bind();sqlite3_close(db);}catch(const exception&e){cerr<<e.what()<<endl;return 1;}}


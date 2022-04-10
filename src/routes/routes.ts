import { IncomingMessage, ServerResponse } from 'http';
import { response_message } from "../helper/error.handler";
import { signup, login, get_all_courses, create_course, delete_course, get_course, select_course, update_course, update_profile, logout } from "../controller/controller";


const routes_call = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {

    let url: URL = new URL(req.url!, `http://${req.headers.host}`);

    console.log(url);


    if (url.pathname == "/signup" && req.method == "POST") {
        signup(req, res);
    }

    if (url.pathname == "/login" && req.method == "POST") {
        login(req, res);
    }

    // /^\/getallcourse\?id=./
    if (url.pathname == "/getallcourse" && req.method == "GET") {
        get_all_courses(req, res, url);
    }

    if (url.pathname == "/createcourse" && req.method == "POST") {
        create_course(req, res);
    }

    if (url.pathname == "/deletecourse" && req.method == "DELETE") {
        delete_course(req, res, url);
    }

    if (url.pathname == "/getmycourses" && req.method == "GET") {
        get_course(req, res);
    }

    if (url.pathname == "/selectcourse" && req.method == "GET") {
        select_course(req, res, url);
    }

    if (url.pathname == "/updatecourse" && req.method == "POST") {
        update_course(req, res, url);
    }

    if (url.pathname == "/updateprofile" && req.method == "POST") {
        update_profile(req, res);
    }

    if (url.pathname == "/logout" && req.method == "GET") {
        logout(req, res);
    }

}

export default routes_call;
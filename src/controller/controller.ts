import { IncomingMessage, ServerResponse } from 'http';
import { handle_errors, response_message } from "../helper/error.handler";
import validater from "../helper/validation";
import bcrypt from "bcrypt";
import { client } from '../dbconfig/dbconnector';
import createToken from "../helper/create.token";
import { User } from "../helper/type";
import { verify_auth } from "../middleware/authMiddleware";

const saltRounds: number = 10;

interface SQL {
    text: string;
    values?: any[];
}

const get_cookies = (request: IncomingMessage): any => {
    let cookies: Record<string, any> = {};
    if (request.headers && request.headers.cookie) {
        request.headers && request.headers.cookie.split(';').forEach(function (cookie: any) {
            let parts = cookie.match(/(.*?)=(.*)$/)
            cookies[parts[1].trim()] = (parts[2] || '').trim();
        });
        return cookies;
    }
    return "";
};

const signup = async (req: IncomingMessage, res: ServerResponse) => {

    try {
        let body: string = '';
        req.on('data', (chunk): void => {
            body += chunk.toString(); // convert Buffer to string
        });

        req.on('end', async (): Promise<void> => {

            try {

                let data: Record<string, any> = JSON.parse(body);

                if (!data["password"]) {
                    response_message("Password field is required", 400, res)
                    return;
                }


                if (!(data.role.toString().toLowerCase() == "teacher" || data.role.toString().toLowerCase() == "student")) {
                    response_message("Role must be teacher or student", 400, res)
                    return;
                }

                if (!validater.phone_no(data.phone)) {
                    response_message("Please input correct Phone no", 400, res)
                    return;
                }

                const salt: string = await bcrypt.genSalt(saltRounds);
                const password: string = await bcrypt.hash(data["password"], salt);


                const sql: SQL = {
                    text: 'INSERT INTO users(name, email, password, phone, role, gender) VALUES($1, $2, $3, $4, $5, $6)',
                    values: [data.name, data.email, password, data.phone, data.role, data.gender ? data.gender : null],
                }

                const response = await client.query(sql); //type--------

                console.log(response);


                if (response.command == "INSERT") {
                    const token: string = createToken(data.email);
                    res.setHeader('Set-Cookie', [`token=${token}; Max-Age=3000; HttpOnly`]);
                    response_message("User successfully created", 200, res)
                }

            } catch (error: any) {
                handle_errors(error)
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(handle_errors(error)));
                res.end();
            }

        });

    } catch (error: any) {
        console.log("last catch in signup----");
        handle_errors(error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.write(JSON.stringify({ message: "Something went wrong" }));
        res.end();
    }
}

const login = async (req: IncomingMessage, res: ServerResponse) => {
    let token: string = get_cookies(req)['token'];

    try {
        await verify_auth(token);
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.write(JSON.stringify({ message: "You are already login" }));
        res.end();
        return;
    } catch (error) {
        let body: string = '';
        req.on('data', (chunk): void => {
            body += chunk.toString(); // convert Buffer to string
        });

        req.on('end', async (): Promise<void> => {

            try {

                let data: Record<string, any> = JSON.parse(body);

                const query: SQL = {
                    text: 'SELECT email, password FROM users WHERE email = $1',
                    values: [data.email],
                }

                const { rows } = await client.query(query);


                const auth: boolean = await bcrypt.compare(data.password, rows[0].password); // true

                if (auth) {
                    const token: string = createToken(rows[0].email);
                    res.setHeader('Set-Cookie', [`token=${token}; Max-Age=3000; HttpOnly`]);
                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify({ message: "Login Successfuly" }));
                    res.end();
                } else {
                    response_message("Please Check your email or password", 400, res);
                    return;
                }

            } catch (error) {
                handle_errors(error)
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(handle_errors(error)));
                res.end();
            }

        });
    }
}

const get_all_courses = async (req: IncomingMessage, res: ServerResponse, url: URL) => {

    let token: string = get_cookies(req)['token'];

    try {

        await verify_auth(token);

        try {
            const sql: SQL = {
                text: 'SELECT id, name, user_name AS created_by, created_at, type, level, time_duration, language FROM course'
            }
            const { rows } = await client.query(sql);

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify({
                data: rows
            }));
            res.end();
        } catch (error) {
            handle_errors(error)
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(handle_errors(error)));
            res.end();
        }


    } catch (error) {
        response_message("Please Login to see all courses", 400, res)
        return;
    }
}

const create_course = async (req: IncomingMessage, res: ServerResponse) => {

    let token: string = get_cookies(req)['token'];

    try {

        const decodedToken = await verify_auth(token);

        let body: string = '';
        req.on('data', (chunk): void => {
            body += chunk.toString(); // convert Buffer to string
        });


        req.on('end', async (): Promise<void> => {

            try {

                let data: Record<string, any> = JSON.parse(body);

                const query: SQL = {
                    text: 'SELECT id, name, role FROM users WHERE email = $1',
                    values: [decodedToken.email],
                }

                const { rows } = await client.query(query);

                if (rows[0].role.toLowerCase() !== "teacher") {
                    response_message("You are not allowed to create course", 400, res);
                    return;
                }

                const sql: SQL = {
                    text: 'INSERT INTO course(name, user_id, user_name, created_at, type, level, time_duration, language) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
                    values: [data.name, rows[0].id, rows[0].name, data.created_at, data.type ? data.type : null, data.level, data.time_duration, data.language],
                }


                await client.query(sql);

                response_message("Course Created", 200, res);

            } catch (error) {
                handle_errors(error)
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(handle_errors(error)));
                res.end();
            }

        });

    } catch (error) {
        response_message("Please Login before inserting some data", 400, res);
        return
    }
}

const delete_course = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
    let token: string = get_cookies(req)['token'];

    if (!url.search) {
        response_message("Course id must required", 400, res);
        return
    }
    let id: number = parseInt(url.search.substring(url.search.indexOf("=") + 1));

    try {

        const decodedToken = await verify_auth(token);

        try {
            const user_query: SQL = {
                text: 'SELECT id, role FROM users WHERE email = $1',
                values: [decodedToken.email],
            }

            const { rows: user_res } = await client.query(user_query);


            const course_query: SQL = {
                text: 'SELECT user_id FROM course WHERE id = $1',
                values: [id],
            };

            const { rows: course_res } = await client.query(course_query);

            if (course_res[0].user_id !== user_res[0].id) {
                response_message("You are not allowed to delete this course", 400, res);
                return;
            }

            const query: SQL = {
                text: 'DELETE FROM course WHERE id = $1',
                values: [id],
            }

            const response: any = await client.query(query);

            if (response.rowCount) {
                response_message("Course Deleted ", 200, res);
                return;
            } else {
                response_message("Course does not exist", 400, res);
                return;
            }

        } catch (error) {
            console.log("in error");
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(handle_errors(error)));
            res.end();
        };

    } catch (error) {
        response_message("Please Login before deleting some data", 400, res);
        return;
    }
}

const get_course = async (req: IncomingMessage, res: ServerResponse) => {
    let token: string = get_cookies(req)['token'];

    try {

        const decodedToken = await verify_auth(token);

        try {
            const user_query: SQL = {
                text: 'SELECT id, role FROM users WHERE email = $1',
                values: [decodedToken.email],
            }

            const { rows: user_res }: any = await client.query(user_query);

            if (user_res[0].role.toLowerCase() === "teacher") {
                const course_query: SQL = {
                    text: 'SELECT id, name, user_name, created_at, type, level, time_duration, language FROM course WHERE user_id = $1',
                    values: [user_res[0].id],
                };

                const { rows }: any = await client.query(course_query);

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify({
                    data: rows
                }));
                res.end();
            } else {

                const course_query: SQL = {
                    text: `SELECT 
                    course.id, course.name, course.user_id AS created_by, course.created_at, course.type, course.level, course.time_duration, course.language
                    FROM course 
                    INNER JOIN student_course
                    ON course.id = student_course.course_id
                    WHERE student_course.user_id = $1`,
                    values: [user_res[0].id],
                };

                const { rows }: any = await client.query(course_query);

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify({
                    data: rows
                }));
                res.end();
                return
            }


        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(handle_errors(error)));
            res.end();
        }

    } catch (error) {
        response_message("Please Login to see your all courses", 400, res);
        return;
    }

}

const select_course = async (req: IncomingMessage, res: ServerResponse, url: URL) => {

    let token: string = get_cookies(req)['token'];

    // console.log(url.searchParams.get);

    if (!url.search) {
        response_message("Course id must required", 400, res);
        return
    }
    let course_id: number = parseInt(url.search.substring(url.search.indexOf("=") + 1));

    try {

        const decodedToken = await verify_auth(token);
        try {

            console.log(decodedToken.email);

            const query: SQL = {
                text: 'SELECT id, role FROM users WHERE email = $1',
                values: [decodedToken.email],
            }

            const { rows } = await client.query(query);

            if (rows[0].role.toLowerCase() !== "student") {
                response_message("You are not allowed to select course", 400, res);
                return;
            }

            const sql: SQL = {
                text: 'INSERT INTO student_course(user_id, course_id) VALUES($1, $2)',
                values: [rows[0].id, course_id],
            }

            await client.query(sql);
            response_message("Course Selected", 200, res);
            return;

        } catch (error: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(handle_errors(error)));
            res.end();
        }

    } catch (error) {
        response_message("Please Login before selecting some course", 400, res);
    }
}

const update_course = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
    let token: string = get_cookies(req)['token'];

    if (!url.search) {
        response_message("Course id must required", 400, res);
        return
    }
    let id: number = parseInt(url.search.substring(url.search.indexOf("=") + 1));

    try {

        const decodedToken = await verify_auth(token);

        let body: string = '';
        req.on('data', (chunk): void => {
            body += chunk.toString(); // convert Buffer to string
        });


        req.on('end', async (): Promise<void> => {

            try {

                let data: Record<string, any> = JSON.parse(body);

                if (!Object.keys(data).length) {
                    response_message("Please input correct JSON data", 400, res);
                }

                const user_query: SQL = {
                    text: 'SELECT id, role FROM users WHERE email = $1',
                    values: [decodedToken.email],
                }

                const { rows: user_res } = await client.query(user_query);

                console.log(user_res);


                const course_query: SQL = {
                    text: 'SELECT user_id, name, type, level, time_duration, language  FROM course WHERE id = $1',
                    values: [id],
                };

                const { rows: course_res } = await client.query(course_query);

                if (course_res[0].user_id !== user_res[0].id && user_res[0].role.toLowerCase() !== "teacher") {
                    response_message("You are not allowed to update course", 400, res);
                    return;
                }

                const sql: SQL = {
                    text: `UPDATE course
                    SET name = $1, type = $2, level = $3, time_duration = $4, language = $5
                    WHERE id = $6`,
                    values: [data.name ? data.name : course_res[0].name, data.type ? data.type : course_res[0].type,
                    data.level ? data.level : course_res[0].level, data.time_duration ? data.time_duration : course_res[0].time_duration, data.language ? data.language : course_res[0].language, id],
                }


                await client.query(sql);

                response_message("Course Updated successfully", 200, res);

            } catch (error: any) {

                handle_errors(error)
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(handle_errors(error)));
                res.end();

            }

        });

    } catch (error) {
        response_message("Please Login before inserting some data", 400, res);
        return
    }
}

const update_profile = async (req: IncomingMessage, res: ServerResponse) => {
    let token: string = get_cookies(req)['token'];

    try {

        const decodedToken = await verify_auth(token);

        let body: string = '';
        req.on('data', (chunk): void => {
            body += chunk.toString(); // convert Buffer to string
        });


        req.on('end', async (): Promise<void> => {

            try {

                let data: Record<string, any> = JSON.parse(body);

                if (data.role && !(data.role.toString().toLowerCase() == "teacher" || data.role.toString().toLowerCase() == "student")) {
                    response_message("Role must be teacher or student", 400, res)
                    return;
                }

                if (data.phone && !validater.phone_no(data.phone)) {
                    response_message("Please input correct Phone no", 400, res)
                    return;
                }

                if (!Object.keys(data).length) {
                    response_message("Please input correct JSON data", 400, res);
                }

                const user_query: SQL = {
                    text: 'SELECT id, name, phone, role, gender FROM users WHERE email = $1',
                    values: [decodedToken.email],
                }

                const { rows: user_res } = await client.query(user_query);

                console.log(user_res);

                // name, phone, role, gender
                const sql: SQL = {
                    text: `UPDATE users
                        SET name = $1, phone = $2, role = $3, gender = $4 
                        WHERE id = $5`,
                    values: [data.name ? data.name : user_res[0].name, data.phone ? data.phone : user_res[0].phone,
                    data.role ? data.role : user_res[0].role, data.gender ? data.gender : user_res[0].gender, user_res[0].id],
                }


                await client.query(sql);

                response_message("Profile Updated successfully", 200, res);

            } catch (error: any) {

                handle_errors(error)
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(handle_errors(error)));
                res.end();

            }

        });

    } catch (error) {
        response_message("Please Login before inserting some data", 400, res);
        return
    }
}

const logout = async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Set-Cookie', [`token=''; Max-Age=0; HttpOnly`]);
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ message: "Logout Successfuly" }));
    res.end();
}

export { signup, login, get_all_courses, create_course, delete_course, get_course, select_course, update_course, update_profile, logout };
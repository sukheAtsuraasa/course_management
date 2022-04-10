import { ServerResponse } from 'http';

const handle_errors = (err: any): object => {
    // console.log(err)
    console.log(err.message)

    if (err.message.includes("is out of range for type integer")) {
        const errors: object = {
            message: `Course id does not exist`
        }
        return errors;
    }
    if (err.message.includes("duplicate key")) {
        const errors: object = {
            message: `${err.constraint} Already Exist`
        }
        return errors;
    }
    if (err.message.includes("null value in column")) {
        const errors: object = {
            message: `${err.column.charAt(0).toUpperCase() + err.column.slice(1)} field is required`
        }
        return errors;
    }
    if (err.message.includes("JSON")) {
        const errors: object = {
            message: `Please input correct JSON data`
        }
        return errors;
    }
    if (err.message.includes("password")) {
        const errors: object = {
            message: `Please Check your email or password`
        }
        return errors;
    }
    if (err.message.includes("Cannot read properties of undefined (reading 'user_id')")) {
        const errors: object = {
            message: `Course does not exist`
        }
        return errors;
    }
    if (err.message.includes("invalid input syntax for type integer") || err.message.includes('insert or update on table "student_course" violates foreign key  foreign key constraint "student_course_fk_1"')) {
        const errors: object = {
            message: `Please Input correct course id`
        }
        return errors;
    }
    if (err.message.includes('violates foreign key constraint "student_course_fk_1" on table "student_course"')) {
        const errors: object = {
            message: `Student are doing course you can not delete now`
        }
        return errors;
    }
    if (err.detail.includes('is not present in table "course".')) {
        const errors: object = {
            message: `Course does not exist`
        }
        return errors;
    }

    const errors: object = {
        message: ``
    }
    return errors;

};

const response_message = (msg: string, code: number, res: ServerResponse): void => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({
        message: msg
    }));
    res.end();
    return;
}

export { handle_errors, response_message };

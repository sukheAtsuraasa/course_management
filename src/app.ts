import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { dbConnect } from './dbconfig/dbconnector';
import routes_call from "./routes/routes";

const port = parseInt(process.env.PORT || '3000');

dbConnect()
    .then((log) => console.log(`${log}`))
    .catch((error: Error) => {
        console.log(error)
    });

const server: Server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    routes_call(req, res);
})


// function test({ a }: { a: string; }) {

// }

// function test1({ a }: { a: string | undefined | number | null; }) {
//     test({ a: a! });
// }

server.listen(port, function () {
    console.log(`Server is listening on port ${port} for requests`);
});


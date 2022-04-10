import { Client } from 'pg';

interface CLIENT {
  max: number;
  connectionString: string;
  idleTimeoutMillis: number
}

let connection_obj: CLIENT = {
  max: 20,
  connectionString: 'postgres://postgres:admin@localhost:5432/CourseManagment',
  idleTimeoutMillis: 30000
}

const client = new Client(connection_obj);

const dbConnect = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.connect((err: any): void => {
      if (err) {
        let msg: string = `connection error ${err}`;
        reject(msg)
      } else {
        let msg: string = 'DB onnected';
        resolve(msg)
      }
    })
  });

}

export { dbConnect, client }; 
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '5s', target: 1000 },
        { duration: '5s', target: 2000 },
        { duration: '5s', target: 4000 },
        { duration: '5s', target: 6000 },
        { duration: '5s', target: 8000 },
        { duration: '5s', target: 10000 },
        { duration: '10s', target: 10000 },
        { duration: '5s', target: 0 },
    ],
};

export default function () {
    const url = 'https://localhost:7130/api/usuario/login';

    const payload = JSON.stringify({
        email: 'teste@teste.com',
        senha: 'senhaerrada'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = http.post(url, payload, params);

    check(response, {
        'status 401 ou 429': (r) =>
            r.status === 401 || r.status === 429
    });

    sleep(0.5);
}
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '5s', target: 50 },
        { duration: '5s', target: 100 },
        { duration: '5s', target: 150 },
        { duration: '5s', target: 200 },
        { duration: '5s', target: 250 },
        { duration: '10s', target: 250 },
        { duration: '5s', target: 0 },
    ],
};
export default function () {
    const url = 'https://localhost:7130/api/registro-glicemia';

    const payload = JSON.stringify({
        glicemia: 120,
        glicemiaAcimaDoLimite: false,
        dose: 5,
        hora: '12:00:00',
        refeicao: 'Almoço',
        data: '2026-09-27',
        observacao: 'Teste de carga'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJjYXJnYUB0ZXN0ZS5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc3VhcmlvIiwiZXhwIjoxNzkwNTY4ODYzLCJpc3MiOiJUaWFCZXRlIiwiYXVkIjoiVGlhQmV0ZSJ9.kQWSOwnZBz3Rqd5ez3weLo9Q71dfOSgD9ES5C6aM9M8'
        }
    };

    const response = http.post(
        url,
        payload,
        params
    );

    check(response, {
        'status 200, 201 ou 429': (r) =>
            r.status === 200 ||
            r.status === 201 ||
            r.status === 429
    });

    sleep(0.5);
}
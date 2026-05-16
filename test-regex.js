const regex = /^\/(?!api\/)/;
const testPaths = [
    '/api/developer/school/register',
    '/api/auth',
    '/public/style.css',
    '/',
    '/register'
];

testPaths.forEach(path => {
    console.log(`${path} matches: ${regex.test(path)}`);
});

export * from './interface/ports/repo-fetch.port';
export * from './interface/ports/workdir.port';

// 🔴 INTENTIONAL ERRORS FOR CI TESTING 🔴
var unusedVariable = "This will trigger lint errors!";  // Using 'var' instead of 'const' + unused variable
const x = 1;  // Unused variable


// Simple auth module
function login(username, password) {
  return { token: 'jwt-token-here', user: username };
}

function logout() {
  return { success: true };
}

module.exports = { login, logout };

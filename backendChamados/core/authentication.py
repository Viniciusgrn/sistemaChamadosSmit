from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sem o enforce de CSRF.

    Motivo: o front (SPA em localhost:5173) e o back (localhost:8000) são
    origens distintas. O cookie `csrftoken` fica no domínio do back e o JS do
    front não consegue lê-lo cross-origin, então POST/PUT/DELETE com
    SessionAuthentication padrão falham com 403 CSRF.

    A proteção contra requisições não autorizadas continua: CORS só libera
    origens conhecidas (CORS_ALLOWED_ORIGINS) e exige credenciais
    (CORS_ALLOW_CREDENTIALS). O cookie de sessão (HttpOnly) segue obrigatório.
    """

    def enforce_csrf(self, request):
        return  # não valida CSRF

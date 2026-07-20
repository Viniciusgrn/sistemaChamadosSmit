class AuditMixin:
    def _audit_user(self):
        user = getattr(self.request, 'user', None)
        if user is None or not user.is_authenticated:
            return None
        return user

    def perform_create(self, serializer):
        user = self._audit_user()
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self._audit_user())

from django.db import models
from django.conf import settings


class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(active=True, visible=True)

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = models.Manager()        
    actives = ActiveManager() 
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+', editable=False, null=True, blank=True,)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+', editable=False, null=True, blank=True,)
    active = models.BooleanField(default=True)
    visible = models.BooleanField(default=True)
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['active', 'visible']),
        ]
"""
Troca o M2M solto Equipe<->Tecnico por um through-model com período.

Antes, sair da equipe (`tecnicos.remove`) apagava a linha e, com ela, todo o
histórico do técnico: os contadores de atendimento e horas são derivados desse
M2M. Agora a linha permanece com `saiu_em` carimbado.

A conversão dos dados roda ANTES do AlterField, porque é o AlterField que
derruba a tabela antiga do M2M automático.
"""
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def m2m_para_participacoes(apps, schema_editor):
    """Cada vínculo atual vira uma participação.

    Não temos quando cada um entrou de fato — o M2M nunca guardou isso —, então
    usamos o nascimento da equipe como `entrou_em`. Equipe já encerrada fecha a
    participação na data do encerramento; equipe aberta fica com `saiu_em` nulo.
    """
    Equipe = apps.get_model('equipeTecnica', 'Equipe')
    Participacao = apps.get_model('equipeTecnica', 'ParticipacaoEquipe')

    novas = []
    for equipe in Equipe.objects.prefetch_related('tecnicos'):
        for tecnico in equipe.tecnicos.all():
            novas.append(Participacao(
                equipe=equipe,
                tecnico=tecnico,
                entrou_em=equipe.created_at,
                saiu_em=equipe.encerrada_em,
            ))
    Participacao.objects.bulk_create(novas)


def participacoes_para_m2m(apps, schema_editor):
    """Reverso: reconstrói o M2M só com quem ainda estava dentro."""
    Equipe = apps.get_model('equipeTecnica', 'Equipe')
    Participacao = apps.get_model('equipeTecnica', 'ParticipacaoEquipe')

    for equipe in Equipe.objects.all():
        ids = Participacao.objects.filter(
            equipe=equipe, saiu_em__isnull=True
        ).values_list('tecnico_id', flat=True)
        equipe.tecnicos.set(list(ids))


class Migration(migrations.Migration):

    dependencies = [
        ('equipeTecnica', '0006_tecnico_cargo'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ParticipacaoEquipe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('active', models.BooleanField(default=True)),
                ('visible', models.BooleanField(default=True)),
                ('entrou_em', models.DateTimeField(default=django.utils.timezone.now)),
                ('saiu_em', models.DateTimeField(blank=True, null=True)),
                ('created_by', models.ForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('equipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participacoes', to='equipeTecnica.equipe')),
                ('tecnico', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='participacoes', to='equipeTecnica.tecnico')),
                ('updated_by', models.ForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['entrou_em'],
                'abstract': False,
            },
        ),
        migrations.AddIndex(
            model_name='participacaoequipe',
            index=models.Index(fields=['-created_at'], name='equipeTecni_created_d34b42_idx'),
        ),
        migrations.AddIndex(
            model_name='participacaoequipe',
            index=models.Index(fields=['active', 'visible'], name='equipeTecni_active_f92940_idx'),
        ),
        migrations.AddConstraint(
            model_name='participacaoequipe',
            constraint=models.UniqueConstraint(
                condition=models.Q(('saiu_em__isnull', True)),
                fields=('equipe', 'tecnico'),
                name='unica_participacao_aberta_por_equipe',
            ),
        ),

        # copia os vínculos ANTES de a tabela antiga ser derrubada
        migrations.RunPython(m2m_para_participacoes, participacoes_para_m2m),

        # O schema editor recusa adicionar `through=` via AlterField, então
        # separamos: o estado passa a enxergar o through-model, e no banco a
        # tabela antiga do M2M automático é derrubada na mão (os dados dela já
        # foram copiados no RunPython acima).
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='equipe',
                    name='tecnicos',
                    field=models.ManyToManyField(
                        related_name='equipes',
                        through='equipeTecnica.ParticipacaoEquipe',
                        to='equipeTecnica.tecnico',
                    ),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql='DROP TABLE `equipeTecnica_equipe_tecnicos`',
                    reverse_sql="""
                        CREATE TABLE `equipeTecnica_equipe_tecnicos` (
                          `id` bigint NOT NULL AUTO_INCREMENT,
                          `equipe_id` bigint NOT NULL,
                          `tecnico_id` bigint NOT NULL,
                          PRIMARY KEY (`id`),
                          UNIQUE KEY `equipeTecnica_equipe_tecnicos_equipe_id_tecnico_id_0f11ce51_uniq` (`equipe_id`,`tecnico_id`),
                          KEY `equipeTecnica_equipe_tecnico_id_0d9ed5f0_fk_equipeTec` (`tecnico_id`),
                          CONSTRAINT `equipeTecnica_equipe_equipe_id_20ac4782_fk_equipeTec`
                            FOREIGN KEY (`equipe_id`) REFERENCES `equipeTecnica_equipe` (`id`),
                          CONSTRAINT `equipeTecnica_equipe_tecnico_id_0d9ed5f0_fk_equipeTec`
                            FOREIGN KEY (`tecnico_id`) REFERENCES `equipeTecnica_tecnico` (`id`)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """,
                ),
            ],
        ),
    ]

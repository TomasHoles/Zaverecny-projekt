from django.core.management.base import BaseCommand
from goals.models import FinancialGoal

class Command(BaseCommand):
    help = 'Aktualizuje barvy existujících cílů na novou paletu'

    def handle(self, *args, **options):
        # Mapování starých barev na nové
        color_mapping = {
            '#FF4742': '#10B981',  # červená -> zelená
            '#F59E0B': '#ccff00',  # oranžová -> žlutá
            '#F97316': '#14b8a6',  # oranžová -> teal
            '#3B82F6': '#8B5CF6',  # modrá -> fialová
        }
        
        updated_count = 0
        
        for goal in FinancialGoal.objects.all():
            if goal.color in color_mapping:
                old_color = goal.color
                goal.color = color_mapping[old_color]
                goal.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Aktualizován cíl "{goal.name}": {old_color} -> {goal.color}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCelkem aktualizováno {updated_count} cílů'
            )
        )

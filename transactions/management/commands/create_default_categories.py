from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from transactions.models import Category

User = get_user_model()

class Command(BaseCommand):
    help = 'Vytvoří výchozí kategorie pro uživatele'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, help='ID uživatele')

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        
        if user_id:
            users = User.objects.filter(id=user_id)
        else:
            users = User.objects.all()

        default_categories = [
            {'name': 'Jídlo a nápoje', 'icon': 'food', 'color': '#FF6B6B', 'description': 'Nákupy potravin, restaurace', 'category_type': 'EXPENSE'},
            {'name': 'Doprava', 'icon': 'transport', 'color': '#4ECDC4', 'description': 'MHD, benzín, taxi', 'category_type': 'EXPENSE'},
            {'name': 'Bydlení', 'icon': 'home', 'color': '#45B7D1', 'description': 'Nájem, energie, opravy', 'category_type': 'EXPENSE'},
            {'name': 'Zábava', 'icon': 'entertainment', 'color': '#F7DC6F', 'description': 'Kino, sport, hobby', 'category_type': 'EXPENSE'},
            {'name': 'Oblečení', 'icon': 'clothing', 'color': '#BB8FCE', 'description': 'Oblečení a obuv', 'category_type': 'EXPENSE'},
            {'name': 'Zdraví', 'icon': 'health', 'color': '#85C1E2', 'description': 'Léky, lékař, fitness', 'category_type': 'EXPENSE'},
            {'name': 'Vzdělání', 'icon': 'education', 'color': '#52B788', 'description': 'Kurzy, knihy, škola', 'category_type': 'EXPENSE'},
            {'name': 'Ostatní výdaje', 'icon': 'expense', 'color': '#95A5A6', 'description': 'Ostatní výdaje', 'category_type': 'EXPENSE'},
            {'name': 'Mzda', 'icon': 'income', 'color': '#2ECC71', 'description': 'Pravidelný příjem z práce', 'category_type': 'INCOME'},
            {'name': 'Investice', 'icon': 'trending-up', 'color': '#3498DB', 'description': 'Výnosy z investic', 'category_type': 'INCOME'},
            {'name': 'Dary', 'icon': 'gift', 'color': '#E74C3C', 'description': 'Dárky od rodiny a přátel', 'category_type': 'INCOME'},
            {'name': 'Ostatní příjmy', 'icon': 'wallet', 'color': '#16A085', 'description': 'Ostatní příjmy', 'category_type': 'INCOME'},
        ]

        total_created = 0
        for user in users:
            self.stdout.write(f'Vytvářím kategorie pro uživatele: {user.username}...')
            
            for cat_data in default_categories:
                category, created = Category.objects.get_or_create(
                    user=user,
                    name=cat_data['name'],
                    defaults={
                        'icon': cat_data['icon'],
                        'color': cat_data['color'],
                        'description': cat_data['description'],
                        'category_type': cat_data['category_type']
                    }
                )
                if created:
                    total_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {cat_data["icon"]} {cat_data["name"]}'))

        self.stdout.write(self.style.SUCCESS(f'\nCelkem vytvořeno {total_created} nových kategorií'))

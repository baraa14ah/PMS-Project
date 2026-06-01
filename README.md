backend:
cd backend
composer install
copy .env.example .env
php artisan key:generate
# (يجب عليهم إنشاء قاعدة بيانات فارغة في phpMyAdmin ووضع اسمها في ملف .env)
php artisan migrate
php artisan serve





frontend:
cd frontend
npm install
npm run dev

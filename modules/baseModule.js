// baseModule.js
const fs = require('fs');
const path = require('path');

// Путь к файлу с пользователями
const usersFilePath = path.join(__dirname, '/../base', 'users.json');

// Функция для загрузки пользователей из файла
const loadUsers = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        return {};
    }
};

// Доступные модели
const models = {
    "Free V1": "runware:100@1",
    "Premium V1": "urn:air:sdxl:checkpoint:civitai:133005@920957",
    "Premium V2": "urn:air:flux1:checkpoint:civitai:618692@691639"
};

// Функция для сохранения пользователей в файл
const saveUsers = (users) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Ошибка при сохранении пользователей:', error);
    }
};

// Экспорт модуля
module.exports = {
    loadUsers,
    saveUsers,
    models
};

const { loadUsers, saveUsers } = require('./baseModule'); // Импортируем функции для работы с пользователями

let nextResetTime = Date.now() + 60 * 60 * 1000; // Устанавливаем начальное время следующего обнуления
const MSK_OFFSET = 3 * 60 * 60 * 1000; // Смещение по времени для Москвы (UTC+3)

// Функция для обнуления попыток
function resetAttempts() {
    const users = loadUsers();
    for (const userId in users) {
        users[userId].attempts = 0; // Обнуляем попытки всех пользователей
    }
    nextResetTime = Date.now() + 60 * 60 * 1000; // Пересчитываем время следующего обнуления
    console.log(`Попытки обнулены. Следующее обнуление будет в ${getNextResetTimeMSK()}`);
    saveUsers(users); // Сохраняем обновленное состояние пользователей
}

// Запускаем таймер для обнуления попыток каждый час
setInterval(() => {
    resetAttempts();
}, 60 * 60 * 1000); // 1 час в миллисекундах

// Функция для получения времени следующего обнуления по МСК
function getNextResetTimeMSK() {
    const resetTimeInMSK = new Date(nextResetTime + MSK_OFFSET); // Переводим время в МСК
    return resetTimeInMSK.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// Функция для вывода оставшегося времени до обнуления
function getTimeUntilReset() {
    const timeLeft = nextResetTime - Date.now();
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return `${minutes} минут и ${seconds} секунд`;
}

// Экспортируем функции
module.exports = {
    resetAttempts,
    getNextResetTimeMSK,
    getTimeUntilReset,
};

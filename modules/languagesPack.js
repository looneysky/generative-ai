// translations.js

const translations = {
    en: {
        startMessage: '👋 Hello! I am an instant image generation bot.\n\n🖼️ Send me any text, and I will generate an image in seconds!✨',
        buyPremium: '💳 Buy premium',
        attemptLimitMessage: 'Your attempt limit has been reached.\nTry again in {time} or upgrade to premium for unlimited access.',
        adultContentMessage: '😵 Generating 18+ content is allowed only with a subscription.',
        subscribeMessage: '❌ You need to subscribe to our channel {channel} to use this bot.',
        generatingMessage: '🛠️ Generating image based on request:\n\n"{text}"\n\nPlease wait...',
        errorMessage: '❌ An error occurred while generating the image. Please try again later.',
        regenerateMessage: '🎉 Here is your generated image based on request:\n\n"{text}"\n\n💬 Join our chat: {chat}\n👉 Press the button below to regenerate the image.',
        changeModelMessage: 'Choose a model:',
        modelChangedMessage: '✅ Model has been changed to "{model}"',
        selectSubscriptionPeriodMessage: 'Select subscription period:',
        regenerateSession: '🔄 Regenerating image based on request:\n\n"${prompt}"\n\nPlease wait...',
        paymentInfo: 'To make a payment, transfer {price} rubles to the card: 4048 4150 1147 9926\n\nFor payment inquiries, contact: @webadmin11',
        changeModelButton: '🔄 Change Model',
        regenerateButton: '🖌️ Regenerate Image',
        downloadButton: '↙️ Download',
        onemonthSubs: '1 month - {price} rubles',
        monthsSubs: '6 months - {price} rubles',
        yearSubs: '1 year - {price} rubles',
        languageChanged: 'Language has been changed.',
        chooseLanguage: 'Choose your language:',
        changeLanguageButton: '🌐 Change Language',
    },
    ru: {
        startMessage: '👋 Привет! Я бот для моментальной генерации картинок.\n\n🖼️ Отправь мне любой текст, и я сгенерирую изображение за считанные секунды!✨',
        buyPremium: '💳 Купить премиум',
        attemptLimitMessage: 'Ваш лимит попыток исчерпан.\nПопробуйте снова через {time} или обновите до премиум-версии для неограниченного доступа.',
        adultContentMessage: '😵 Используя данную модель можно генерировать контент 18+ только по подписке.',
        subscribeMessage: '❌ Вы должны подписаться на наш канал {channel}, чтобы использовать этого бота.',
        generatingMessage: '🛠️ Начинаю генерацию по запросу:\n\n"{text}"\n\nПожалуйста, подождите...',
        errorMessage: '❌ Произошла ошибка при генерации изображения. Пожалуйста, попробуйте позже.',
        regenerateMessage: '🎉 Вот ваша генерация по запросу:\n\n"{text}"\n\n💬 Наш чат: {chat}\n👉 Нажмите кнопку ниже, чтобы регенерировать изображение.',
        changeModelMessage: 'Выберите модель:',
        modelChangedMessage: '✅ Модель изменена на "{model}"',
        selectSubscriptionPeriodMessage: 'Выберите период подписки:',
        regenerateSession: '🔄 Регенерирую изображение по запросу:\n\n"${prompt}"\n\nПожалуйста, подождите...',
        paymentInfo: 'Для оплаты продукта переведите {price}р на карту: 4048 4150 1147 9926\n\nПо вопросам оплаты обращаться: @webadmin11',
        changeModelButton: '🔄 Сменить модель',
        regenerateButton: '🖌️ Регенерировать изображение',
        downloadButton: '↙️ Скачать',
        onemonthSubs: '1 месяц - {price} rubles',
        monthsSubs: '6 месяцев - {price} rubles',
        yearSubs: '1 год - {price} rubles',
        languageChanged: 'Язык был изменен.',
        chooseLanguage: 'Выберите ваш язык:',
        changeLanguageButton: '🌐 Сменить язык',
    },
    // More languages can be added here...
};

module.exports = translations;
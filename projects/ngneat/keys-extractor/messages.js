const messages = {
  en: {
    src: {
      confirm: `Are the source files located at "src" folder?`,
      customPath: 'Enter source files location'
    },
    langs: 'To which languages you want to create files for?',
    output: {
      confirm: 'Output files to "/assets/i18n" folder?',
      customPath: 'Enter output files location'
    },
    keysFound: (keysCount, filesCount) =>
      `- ${keysCount} keys were found in ${filesCount} ${filesCount > 1 ? 'files' : 'file'}.`,
    start: langsCount => `Starting Translation ${langsCount > 1 ? 'Files' : 'File'} Build`,
    process: {
      extract: 'Extracting Keys'
    },
    creatingFiles: 'Creating new translation files',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    done: 'Done!'
  },
  ru: {
    src: {
      confirm: `Файлы находятся в папке "src"?`,
      customPath: 'введите расположение исходных файлов'
    },
    langs: 'Для каких языков вы хотите создать файлы',
    output: {
      confirm: `Вывести файлы в папку "/assets/i18n"?`,
      customPath: 'Введите расположение выходных файлов'
    },
    keysFound: (keysCount, filesCount) =>
      `- В ${filesCount} ${filesCount > 1 ? 'файлах' : 'файле'} найдено ${keysCount} ключей.`,
    start: langsCount => `Начало сборки ${langsCount > 1 ? 'файлов' : 'файла'} перевода`,
    process: {
      extract: 'Извлечение ключей'
    },
    creatingFiles: 'Создание новых файлов перевода',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    done: 'Готово!'
  },
  fr: {
    src: {
      confirm: `les fichiers sources sont ils dans le dossier "src"?`,
      customPath: 'Veuillez entrer la localisation des fichiers sources'
    },
    langs: 'Pour quelles languages souhaitez vous créer des fichiers de traduction?',
    output: {
      confirm: 'Ecrire les fichiers dans le dossier "/assets/i18n"?',
      customPath: 'Indiquez le dossier ou vous souhaitez ajouter les fichiers de traduction'
    },
    keysFound: (keysCount, filesCount) =>
      `- ${keysCount} clés ${filesCount} ${filesCount > 1 ? 'fichiers' : 'fichier'}.`,
    start: langsCount => `Initialisation de la traduction des ${langsCount > 1 ? 'fichiers' : 'fichier'}`,
    process: {
      extract: 'Extraction des clés de traduction'
    },
    creatingFiles: 'Création des nouveaux fichiers de traduction',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    done: 'Fini!'
  },
  es: {
    src: {
      confirm: `¿Los archivos de origen están localizados en la carpeta "src"?`,
      customPath: 'Ingrese la ubicación de los archivos de origen'
    },
    langs: '¿Para qué idiomas desea crear archivos?',
    output: {
      confirm: `¿Archivos de salida a la carpeta "/assets/i18n"?`,
      customPath: 'Ingrese la ubicación de los archivos de salida'
    },
    keysFound: (keysCount, filesCount) =>
      `- ${keysCount} llaves fueron encontradas en ${filesCount} ${filesCount > 1 ? 'archivos' : 'archivo'}.`,
    start: langsCount => `Iniciando la construcción del ${langsCount > 1 ? 'archivos' : 'archivo'} de traducción`,
    process: {
      extract: 'Extrayendo llaves'
    },
    creatingFiles: 'Creando nuevos archivos de traducción',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    done: '¡Completo!'
  },
  ja: {},
  zh: {}
};

module.exports = {
  getMessages(locale) {
    return messages[locale] || messages.en;
  }
};

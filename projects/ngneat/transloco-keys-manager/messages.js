const messages = {
  en: {
    src: 'Please specify the root source of your project.',
    output: 'Please specify the output folder for the translation files.',
    config: 'Please specify the path to Transloco config.',
    langs: 'To which languages you want to create files for?',
    keepFlat: 'Keep certain keys flat?',
    hasScope: 'Do you have scopes defined?',
    keysFound: (keysCount, filesCount) =>
      `- ${keysCount} keys were found in ${filesCount} ${filesCount > 1 ? 'files' : 'file'}.`,
    startBuild: langsCount => `Starting Translation ${langsCount > 1 ? 'Files' : 'File'} Build`,
    startSearch: 'Starting Search For Missing Keys',
    extract: 'Extracting Template and Component Keys',
    creatingFiles: 'Creating new translation files',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    checkMissing: 'Checking for missing keys',
    done: 'Done!'
  },
  ru: {
    src: 'Please specify the root source of your project.',
    output: 'Please specify the output folder for the translation files.',
    langs: 'Для каких языков вы хотите создать файлы',
    keysFound: (keysCount, filesCount) =>
      `- В ${filesCount} ${filesCount > 1 ? 'файлах' : 'файле'} найдено ${keysCount} ключей.`,
    startBuild: langsCount => `Начало сборки ${langsCount > 1 ? 'файлов' : 'файла'} перевода`,
    startSearch: 'Starting Search For Missing Keys',
    extract: 'Extracting Template and Component Keys',
    creatingFiles: 'Создание новых файлов перевода',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    checkMissing: 'Checking for missing keys',
    done: 'Готово!'
  },
  fr: {
    src: 'Please specify the root source of your project.',
    output: 'Please specify the output folder for the translation files.',
    langs: 'Pour quelles languages souhaitez vous créer des fichiers de traduction?',
    keysFound: (keysCount, filesCount) =>
      `- ${keysCount} clés ${filesCount} ${filesCount > 1 ? 'fichiers' : 'fichier'}.`,
    startBuild: langsCount => `Initialisation de la traduction des ${langsCount > 1 ? 'fichiers' : 'fichier'}`,
  startSearch: 'Starting Search For Missing Keys',
    extract: 'Extracting Template and Component Keys',
    creatingFiles: 'Création des nouveaux fichiers de traduction',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    checkMissing: 'Checking for missing keys',
    done: 'Fini!'
  },
  es: {
    src: 'Please specify the root source of your project.',
    output: 'Please specify the output folder for the translation files.',
    langs: '¿Para qué idiomas desea crear archivos?',
    keysFound: (keysCount, filesCount) =>
      `- ${keysCount} llaves fueron encontradas en ${filesCount} ${filesCount > 1 ? 'archivos' : 'archivo'}.`,
    startBuild: langsCount => `Iniciando la construcción del ${langsCount > 1 ? 'archivos' : 'archivo'} de traducción`,
    startSearch: 'Starting Search For Missing Keys',
    extract: 'Extracting Template and Component Keys',
    creatingFiles: 'Creando nuevos archivos de traducción',
    merged: (langs, files) =>
      `Existing ${langs.join(',')} translation file${files.length > 1 ? 's were' : ' was'} found and merged 🧙`,
    checkMissing: 'Checking for missing keys',
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

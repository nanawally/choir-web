export type Language = "en" | "sv";

const translations = {
  // Nav
  "nav.concerts": { en: "Concerts", sv: "Konserter" },
  "nav.songs": { en: "Songs", sv: "Stycken" },
  "nav.chorists": { en: "Chorists", sv: "Korister" },
  "nav.voiceGroups": { en: "Voice Groups", sv: "Stämdelningar" },
  "nav.baseFormations": { en: "Base Formations", sv: "Grunduppställningar" },
  "nav.krysslistan": { en: "Krysslistan", sv: "Krysslistan" },
  "nav.termPlan": { en: "Term Plan", sv: "Terminsplan" },
  "nav.settings": { en: "Settings", sv: "Inställningar" },
  "nav.logOut": { en: "Log out", sv: "Logga ut" },

  // Home page
  "home.manageConcerts": {
    en: "Manage concerts and formations",
    sv: "Hantera konserter och uppställningar",
  },
  "home.manageSongs": {
    en: "Manage your repertoire library",
    sv: "Hantera repertoarbiblioteket",
  },
  "home.manageChorists": {
    en: "Manage choir members and voice assignments",
    sv: "Hantera korister och stämindelningar",
  },
  "home.manageVoiceGroups": {
    en: "Manage voice groups and parts",
    sv: "Hantera stämdelningar och stämmor",
  },
  "home.manageBaseFormations": {
    en: "Template formations for new concerts",
    sv: "Malluppställningar för nya konserter",
  },
  "home.attendance": { en: "Attendance tracking", sv: "Närvarohantering" },
  "home.schedule": { en: "Semester schedule", sv: "Terminsschema" },

  // Login
  "login.username": { en: "Username", sv: "Användarnamn" },
  "login.password": { en: "Password", sv: "Lösenord" },
  "login.invalidCredentials": {
    en: "Invalid credentials",
    sv: "Ogiltiga inloggningsuppgifter",
  },
  "login.loggingIn": { en: "Logging in...", sv: "Loggar in..." },
  "login.logIn": { en: "Log in", sv: "Logga in" },

  // Common
  "common.save": { en: "Save", sv: "Spara" },
  "common.cancel": { en: "Cancel", sv: "Avbryt" },
  "common.create": { en: "Create", sv: "Skapa" },
  "common.delete": { en: "Delete", sv: "Ta bort" },
  "common.edit": { en: "Edit", sv: "Redigera" },
  "common.rename": { en: "Rename", sv: "Byt namn" },
  "common.add": { en: "Add", sv: "Lägg till" },
  "common.search": { en: "Search...", sv: "Sök..." },
  "common.filter": { en: "Filter", sv: "Filtrera" },
  "common.clearAll": { en: "Clear all", sv: "Rensa alla" },
  "common.showMore": { en: "Show more", sv: "Visa fler" },
  "common.showLess": { en: "Show less", sv: "Visa färre" },
  "common.yes": { en: "Yes", sv: "Ja" },
  "common.no": { en: "No", sv: "Nej" },
  "common.loading": { en: "Loading...", sv: "Laddar..." },
  "common.copy": { en: "Copy", sv: "Kopiera" },
  "common.creating": { en: "Creating...", sv: "Skapar..." },
  "common.uploading": { en: "Uploading...", sv: "Laddar upp..." },
  "common.standard": { en: "Standard", sv: "Standard" },
  "common.other": { en: "Other", sv: "Övrig" },
  "common.name": { en: "Name", sv: "Namn" },
  "common.unassigned": { en: "— Unassigned —", sv: "— Ej tilldelad —" },
  "common.duplicate": { en: "Duplicate", sv: "Duplicera" },
  "common.saving": { en: "Saving...", sv: "Sparar..." },
  "common.downloadCsv": { en: "Download CSV", sv: "Ladda ner CSV" },
  "common.downloadPng": { en: "Download PNG", sv: "Ladda ner PNG" },
  "common.columnVisibility": {
    en: "Column visibility",
    sv: "Kolumnsynlighet",
  },
  "common.options": { en: "Options", sv: "Alternativ" },
  "common.doubleClickToEdit": {
    en: "Double-click to edit",
    sv: "Dubbelklicka för att redigera",
  },
  "common.clickToRename": {
    en: "Click to rename",
    sv: "Klicka för att byta namn",
  },
  "common.clickToOpenPdf": {
    en: "Click to open full PDF",
    sv: "Klicka för att öppna hela PDF:en",
  },

  // Songs
  "songs.title": { en: "Songs", sv: "Stycken" },
  "songs.addSong": { en: "+ Add song", sv: "+ Lägg till stycke" },
  "songs.addSongTitle": { en: "Add Song", sv: "Lägg till stycke" },
  "songs.editSong": { en: "Edit Song", sv: "Redigera stycke" },
  "songs.noSongs": { en: "No songs yet.", sv: "Inga stycken ännu." },
  "songs.noMatch": {
    en: "No songs match your search.",
    sv: "Inga stycken matchar din sökning.",
  },
  "songs.confirmDelete": {
    en: "Delete this song and remove it from all concerts?",
    sv: "Ta bort detta stycke och ta bort den från alla konserter?",
  },
  "songs.composer": { en: "Composer", sv: "Kompositör" },
  "songs.arranger": { en: "Arranger", sv: "Arrangör" },
  "songs.delning": { en: "Delning", sv: "Delning" },
  "songs.languages": { en: "Languages", sv: "Språk" },
  "songs.languagesHint": {
    en: "Languages (comma-separated)",
    sv: "Språk (kommaseparerade)",
  },
  "songs.length": { en: "Length", sv: "Längd" },
  "songs.lengthHint": {
    en: "Length (MM:SS or MM)",
    sv: "Längd (MM:SS eller MM)",
  },
  "songs.accompanied": { en: "Accompanied", sv: "Ackompanjerad" },
  "songs.instrument": { en: "Instrument", sv: "Instrument" },
  "songs.soloists": { en: "Soloists", sv: "Solister" },
  "songs.soloistNamesHint": {
    en: "Soloist names (comma-separated)",
    sv: "Solistnamn (kommaseparerade)",
  },
  "songs.year": { en: "Year", sv: "År" },
  "songs.yearFrom": { en: "From", sv: "Från" },
  "songs.yearTo": { en: "To", sv: "Till" },
  "songs.sheetMusic": { en: "Sheet music", sv: "Noter" },
  "songs.sheetMusicTitle": { en: "Sheet Music", sv: "Noter" },
  "songs.available": { en: "Available", sv: "Tillgänglig" },
  "songs.collection": { en: "Collection", sv: "Samling" },
  "songs.usedIn": { en: "Used in", sv: "Används i" },
  "songs.viewFullPdf": { en: "View full PDF", sv: "Visa hel PDF" },
  "songs.uploadPdf": { en: "Upload PDF", sv: "Ladda upp PDF" },
  "songs.choosePdf": { en: "Choose PDF", sv: "Välj PDF" },
  "songs.sheetMusicPdf": { en: "Sheet music PDF", sv: "Not-PDF" },
  "songs.confirmDeleteSheet": {
    en: "Delete the uploaded sheet music?",
    sv: "Ta bort den uppladdade noten?",
  },

  // Concerts
  "concerts.title": { en: "Concerts", sv: "Konserter" },
  "concerts.newConcert": { en: "+ New concert", sv: "+ Ny konsert" },
  "concerts.noConcerts": { en: "No concerts yet.", sv: "Inga konserter ännu." },
  "concerts.confirmDelete": {
    en: "Delete {name} and all its formations?",
    sv: "Ta bort {name} och alla dess uppställningar?",
  },
  "concerts.nameForCopy": { en: "Name for the copy:", sv: "Namn för kopian:" },
  "concerts.concertName": { en: "Concert name...", sv: "Konsertnamn..." },
  "concerts.backToConcerts": {
    en: "Back to concerts",
    sv: "Tillbaka till konserter",
  },

  // Chorists
  "chorists.title": { en: "Chorists", sv: "Korister" },
  "chorists.searchByName": { en: "Search by name...", sv: "Sök på namn..." },
  "chorists.addChorist": { en: "+ Add chorist", sv: "+ Lägg till korist" },
  "chorists.addTitle": { en: "Add chorist", sv: "Lägg till korist" },
  "chorists.editTitle": { en: "Edit chorist", sv: "Redigera korist" },
  "chorists.firstName": { en: "First name", sv: "Förnamn" },
  "chorists.lastName": { en: "Last name", sv: "Efternamn" },
  "chorists.sectionLeader": {
    en: "Section leader (stämfiskal)",
    sv: "Stämfiskal",
  },
  "chorists.archived": { en: "Archived Chorists", sv: "Arkiverade korister" },
  "chorists.noChorists": { en: "No chorists yet.", sv: "Inga korister ännu." },
  "chorists.noMatch": {
    en: "No chorists match your search.",
    sv: "Inga korister matchar din sökning.",
  },
  "chorists.noArchived": {
    en: "No archived chorists.",
    sv: "Inga arkiverade korister.",
  },
  "chorists.archive": { en: "Archive", sv: "Arkivera" },
  "chorists.unarchive": { en: "Unarchive", sv: "Avarkivera" },
  "chorists.confirmArchive": {
    en: "Archive {name}?",
    sv: "Arkivera {name}?",
  },
  "chorists.sectionLeaderTooltip": {
    en: "Section leader",
    sv: "Stämfiskal",
  },

  // Voice Groups
  "voiceGroups.title": { en: "Voice Groups", sv: "Stämdelningar" },
  "voiceGroups.description": {
    en: "Standard groups appear in the chorists table and at the top of the concert editor dropdown.",
    sv: "Standardindelningar visas i koristtabellen och högst upp i konsertredigerarens rullgardinsmeny.",
  },
  "voiceGroups.addGroup": { en: "+ Add group", sv: "+ Lägg till stämdelning" },
  "voiceGroups.groupName": { en: "Group name...", sv: "Stämdelningsnamn..." },
  "voiceGroups.noGroups": {
    en: "No voice groups yet.",
    sv: "Inga stämdelningar ännu.",
  },
  "voiceGroups.addPart": { en: "+ Add part", sv: "+ Lägg till stämma" },
  "voiceGroups.partName": { en: "Part name...", sv: "Stämnamn..." },
  "voiceGroups.partCount": { en: "part", sv: "stämma" },
  "voiceGroups.partsCount": { en: "parts", sv: "stämmor" },
  "voiceGroups.deleteGroup": {
    en: "Delete group",
    sv: "Ta bort stämdelning",
  },
  "voiceGroups.confirmDeleteGroup": {
    en: "Delete {name}?",
    sv: "Ta bort {name}?",
  },

  // Base Formations
  "baseFormations.title": { en: "Base Formations", sv: "Grunduppställningar" },
  "baseFormations.description": {
    en: "Base formations are templates that can be copied into concerts.",
    sv: "Grunduppställningar är mallar som kan kopieras till konserter.",
  },
  "baseFormations.newFormation": {
    en: "+ New base formation",
    sv: "+ Ny grunduppställning",
  },
  "baseFormations.formationName": {
    en: "Formation name...",
    sv: "Uppställningsnamn...",
  },
  "baseFormations.noFormations": {
    en: "No base formations yet.",
    sv: "Inga grunduppställningar ännu.",
  },
  "baseFormations.confirmDelete": {
    en: "Delete {name} and all its placements?",
    sv: "Ta bort {name} och alla dess placeringar?",
  },
  "baseFormations.backToBaseFormations": {
    en: "Back to base formations",
    sv: "Tillbaka till grunduppställningar",
  },
  "baseFormations.chorists": { en: "Chorists", sv: "Korister" },
  "baseFormations.allPlaced": {
    en: "All chorists placed.",
    sv: "Alla korister placerade.",
  },
  "baseFormations.placed": { en: "Placed", sv: "Placerade" },

  // Formations
  "formations.addFormation": {
    en: "Add Formation",
    sv: "Lägg till uppställning",
  },
  "formations.newEmpty": {
    en: "New empty formation",
    sv: "Ny tom uppställning",
  },
  "formations.formationName": {
    en: "Formation name",
    sv: "Uppställningsnamn",
  },
  "formations.startFromBase": {
    en: "Start from base formation",
    sv: "Utgå från grunduppställning",
  },
  "formations.reuseFromConcert": {
    en: "Reuse from this concert",
    sv: "Återanvänd från denna konsert",
  },
  "formations.saveFormation": {
    en: "Save formation",
    sv: "Spara uppställning",
  },
  "formations.addNewFormation": {
    en: "Add new formation",
    sv: "Lägg till ny uppställning",
  },
  "formations.confirmDelete": {
    en: "Delete {name}?",
    sv: "Ta bort {name}?",
  },
  "formations.arcRows": {
    en: "Arc rows (empty = rectangular grid)",
    sv: "Bågade rader (tomt = rektangulärt rutnät)",
  },
  "formations.arcRowsShort": { en: "Arc rows", sv: "Bågade rader" },
  "formations.addRow": { en: "+ Add row", sv: "+ Lägg till rad" },
  "formations.row": { en: "Row", sv: "Rad" },
  "formations.copyTo": { en: "Copy to...", sv: "Kopiera till..." },
  "formations.copyToWhichConcert": {
    en: "Copy to which concert?",
    sv: "Kopiera till vilken konsert?",
  },
  "formations.copiedTo": { en: "Copied to", sv: "Kopierad till" },
  "formations.noConcertsToCopy": {
    en: "No other concerts to copy to.",
    sv: "Inga andra konserter att kopiera till.",
  },
  "formations.enterNumber": {
    en: "Enter number:",
    sv: "Ange nummer:",
  },
  "formations.formations": { en: "Formations", sv: "Uppställningar" },
  "formations.arc": { en: "Arc", sv: "Båge" },
  "formations.grid": { en: "Grid", sv: "Rutnät" },
  "formations.title": { en: "Formation", sv: "Uppställning" },
  
  // Roster
  "roster.title": { en: "Concert Roster", sv: "Konsertkorister" },
  "roster.editRoster": { en: "Edit Roster", sv: "Redigera korister" },
  "roster.unplaced": { en: "Unplaced", sv: "Ej placerade" },
  "roster.placed": { en: "Placed", sv: "Placerade" },
  "roster.showOnGrid": { en: "Show on grid", sv: "Visa i rutnätet" },
  "roster.hideFromGrid": {
    en: "Hide from grid",
    sv: "Dölj från rutnätet",
  },

  // Krysslistan
  "krysslistan.title": { en: "Krysslistan", sv: "Krysslistan" },
  "krysslistan.noSheet": {
    en: "No sheet configured.",
    sv: "Inget ark konfigurerat.",
  },

  // Term Plan
  "termPlan.title": { en: "Term Plan", sv: "Terminsplan" },
  "termPlan.noSheet": {
    en: "No sheet configured.",
    sv: "Inget ark konfigurerat.",
  },

  // Settings
  "settings.title": { en: "Settings", sv: "Inställningar" },
  "settings.language": { en: "Language", sv: "Språk" },
  "settings.english": { en: "English", sv: "Engelska" },
  "settings.swedish": { en: "Svenska", sv: "Svenska" },
  "settings.theme": { en: "Theme", sv: "Tema" },
  "settings.themeSystem": { en: "System", sv: "System" },
  "settings.themeLight": { en: "Light", sv: "Ljust" },
  "settings.themeDark": { en: "Dark", sv: "Mörkt" },
} as const;

export type TranslationKey = keyof typeof translations;

export function translate(key: TranslationKey, lang: Language): string {
  return translations[key][lang];
}

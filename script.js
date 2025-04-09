document.addEventListener('DOMContentLoaded', () => {
    const noteInput = document.getElementById('note-input');
    const noteIdInput = document.getElementById('note-id');
    const addButton = document.getElementById('add-button');
    const notesList = document.getElementById('notes-list');
    const offlineIndicator = document.getElementById('offline-indicator');

    // --- Функции для работы с localStorage ---

    // Получить заметки из localStorage
    function getNotes() {
        const notes = localStorage.getItem('notes');
        return notes ? JSON.parse(notes) : [];
    }

    // Сохранить заметки в localStorage
    function saveNotes(notes) {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    // --- Отображение заметок ---

    function renderNotes() {
        notesList.innerHTML = ''; // Очистить список перед рендерингом
        const notes = getNotes();
        notes.sort((a, b) => b.id - a.id); // Сортировка по ID (новые сверху)

        if (notes.length === 0) {
            notesList.innerHTML = '<li>Заметок пока нет.</li>';
            return;
        }

        notes.forEach(note => {
            const li = document.createElement('li');
            li.dataset.id = note.id; // Сохраняем ID в data-атрибуте

            const noteContent = document.createElement('span');
            noteContent.className = 'note-content';
            noteContent.textContent = note.text;
            // Добавляем обработчик клика для редактирования
            noteContent.addEventListener('click', () => startEditNote(note.id));

            const noteActions = document.createElement('div');
            noteActions.className = 'note-actions';

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.addEventListener('click', () => deleteNote(note.id));

            noteActions.appendChild(deleteButton);

            li.appendChild(noteContent);
            li.appendChild(noteActions);
            notesList.appendChild(li);
        });
    }

    // --- Функции для управления заметками ---

    // Добавление или обновление заметки
    function addOrUpdateNote() {
        const noteText = noteInput.value.trim();
        const noteId = noteIdInput.value; // Получаем ID из скрытого поля

        if (!noteText) {
            alert('Пожалуйста, введите текст заметки.');
            return;
        }

        let notes = getNotes();

        if (noteId) {
            // Редактирование существующей заметки
            const noteIndex = notes.findIndex(note => note.id == noteId);
            if (noteIndex > -1) {
                notes[noteIndex].text = noteText;
            }
            // Сброс режима редактирования
            noteIdInput.value = '';
            addButton.textContent = 'Добавить заметку';

        } else {
            // Добавление новой заметки
            const newNote = {
                id: Date.now(), // Простой уникальный ID на основе времени
                text: noteText
            };
            notes.push(newNote);
        }

        saveNotes(notes);
        renderNotes();

        // Очистить поле ввода
        noteInput.value = '';
    }

    // Начать редактирование заметки
    function startEditNote(id) {
        const notes = getNotes();
        const noteToEdit = notes.find(note => note.id === id);
        if (noteToEdit) {
            noteInput.value = noteToEdit.text;
            noteIdInput.value = noteToEdit.id; // Запомнить ID редактируемой заметки
            addButton.textContent = 'Сохранить изменения'; // Изменить текст кнопки
            noteInput.focus(); // Установить фокус на поле ввода
        }
    }


    // Удаление заметки
    function deleteNote(id) {
        if (!confirm('Вы уверены, что хотите удалить эту заметку?')) {
            return;
        }

        let notes = getNotes();
        notes = notes.filter(note => note.id !== id);
        saveNotes(notes);
        renderNotes();
         // Если удаляли редактируемую заметку, сбросить форму
        if (noteIdInput.value == id) {
            noteInput.value = '';
            noteIdInput.value = '';
            addButton.textContent = 'Добавить заметку';
        }
    }

    // --- Обработка статуса сети ---

    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineIndicator.style.display = 'none';
            console.log('Приложение онлайн');
            // Можно добавить логику синхронизации, если бы она была
        } else {
            offlineIndicator.style.display = 'block';
            console.log('Приложение офлайн');
        }
    }

    // --- Инициализация ---

    // Добавить слушатель на кнопку
    addButton.addEventListener('click', addOrUpdateNote);

    // Добавить слушатели для статуса сети
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Первоначальная отрисовка заметок и проверка статуса сети
    renderNotes();
    updateOnlineStatus();
});
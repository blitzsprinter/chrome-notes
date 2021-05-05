import {IListView, INewNoteView, INoteView} from './modules/notes/components/interfaces';
import {Editor} from './modules/notes/editor';
import {Simple} from './modules/notes/simple';
import storage from './modules/storage/storage';
import './styles/style.scss';

var html = storage.get('html');
var isNew = storage.get('new');
var selection = storage.get('selection');
var description = storage.get('description');
var previewState = storage.get('previewState');

var notes: HTMLElement = null;
var listView: IListView = null;
var noteView: INoteView = null;
var newView: INewNoteView = null;

function loadDomElements() {
  notes = <HTMLElement>document.getElementById('notes');
  var listViewElement: HTMLElement = <HTMLElement>document.getElementById('list-view');
  var noteViewElement: HTMLElement = <HTMLElement>document.getElementById('details-view');
  var codemirror = new Editor(
    <HTMLTextAreaElement>document.getElementById('description-note'), 
    <NodeList>document.getElementById('editor-controls').querySelectorAll('div[action]')
  );

  listView = {
    node: listViewElement,
    items: <HTMLElement>document.getElementById('list-items'),
    template: <HTMLElement>document.getElementById('template'),
    addButton: <HTMLButtonElement>document.getElementById('add-note'),
    searchButton: <HTMLButtonElement>document.getElementById('search-button'),
    searchInput: <HTMLInputElement>document.getElementById('search-input'),
  }

  noteView = {
    node: noteViewElement,
    back: <HTMLButtonElement>document.getElementById('to-list'),
    delete: <HTMLButtonElement>document.getElementById('delete-note'),
    preview: <HTMLInputElement>document.getElementById('preview-note'),
    sync: <HTMLInputElement>document.getElementById('sync-note'),
    html: <HTMLElement>document.getElementById('html-preview'),
    editor: codemirror
  };

  newView ={
    node: noteViewElement,
    cancel: <HTMLButtonElement>document.getElementById('cancel-note'),
    create: <HTMLButtonElement>document.getElementById('create-note'),
  }
};

function loadApp() {
  var editor = new Simple(listView, noteView, newView);
  editor.init();
  notes.style.display = 'inherit';

  if (description) {
    if (isNew) {
      editor.selectNew(description, selection);
    } else {
      editor.showNote(description, true, selection, html, previewState);
    }    
  } else {
    editor.showList();
  }

  notes.style.opacity = '1';
};

document.addEventListener('DOMContentLoaded', loadDomElements);
window.addEventListener('load', loadApp);

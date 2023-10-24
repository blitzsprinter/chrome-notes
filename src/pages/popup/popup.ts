import { CachedStorageService } from 'core/services/cached';
import { PopupNotesElement } from 'modules/notes/popup/popup-notes.component';
import { ListViewElement } from 'modules/notes/list-view/list-view.component';
import { ListItemElement } from 'modules/notes/list-item/list-item.component';
import { DetailsViewElement } from 'modules/notes/details-view/details-view.component';
import { db } from 'modules/db';
import 'styles/style.scss';


window.addEventListener('load', async () => {
  const notes = document.getElementById('simple-popup-notes') as PopupNotesElement;
  const configs = await CachedStorageService.get();

  if (configs.selected) {
    notes.hidden = false;
    notes.select(configs.selected, false);
  }

  if (configs.draft) {
    notes.hidden = false;
    notes.draft(configs.draft.title, configs.draft.description, configs.draft.selection);
  }

  db.iterate(item => notes.addItem(item)).then(() => notes.disabled = false);
  notes.hidden = false;
});

customElements.define(ListViewElement.selector, ListViewElement);
customElements.define(ListItemElement.selector, ListItemElement);
customElements.define(DetailsViewElement.selector, DetailsViewElement);
customElements.define(PopupNotesElement.selector, PopupNotesElement);

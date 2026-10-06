(() => {
  const form = document.getElementById('directory-filters');
  const search = document.getElementById('org-search');
  const status = document.getElementById('org-status');
  const type = document.getElementById('org-type');
  const reach = document.getElementById('org-reach');
  const count = document.getElementById('org-count');
  const empty = document.getElementById('org-empty');
  const normalise = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-GB');
  const organisations = [...document.querySelectorAll('.organisation')].map(element => ({element, text:normalise(element.textContent)}));
  function filter() {
    const words = normalise(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const {element, text} of organisations) {
      const matches = words.every(word => text.includes(word)) &&
        (!status.value || element.dataset.status === status.value) &&
        (!type.value || element.dataset.type === type.value) &&
        (!reach.value || element.dataset.reach === reach.value);
      element.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = `${visible} of ${organisations.length} organisations`;
    empty.hidden = visible !== 0;
  }
  form.hidden = false;
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => {
    // The reset event precedes the browser restoring the controls.
    setTimeout(filter, 0);
  });
  filter();
})();

const API_URL = '/api/proyectos';
const state = { projects: [] };
const list = document.querySelector('#project-list');
const search = document.querySelector('#search');
const statusFilter = document.querySelector('#status-filter');
const dialog = document.querySelector('#project-dialog');
const form = document.querySelector('#project-form');
const notice = document.querySelector('#notice');
const errorBox = document.querySelector('#form-error');
const labels = {
  propuesto: 'Propuesto', en_evaluacion: 'En evaluación', aprobado: 'Aprobado',
  en_ejecucion: 'En ejecución', finalizado: 'Finalizado', cancelado: 'Cancelado'
};
const icons = { person: '◉', calendar: '▦', faculty: '⌂', line: '⌁' };

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

async function api(path = '', options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Error de solicitud (${response.status}).`);
  return data;
}

function showNotice(message, type = 'info') {
  notice.textContent = message;
  notice.className = `notice ${type}`;
  notice.hidden = false;
  if (type === 'success') window.setTimeout(() => { notice.hidden = true; }, 3500);
}

function updateSummary() {
  document.querySelector('#total-count').textContent = state.projects.length;
  document.querySelector('#active-count').textContent = state.projects.filter((p) => p.estado === 'en_ejecucion').length;
  document.querySelector('#finished-count').textContent = state.projects.filter((p) => p.estado === 'finalizado').length;
}

function projectCard(project) {
  const progress = Number(project.porcentaje_avance) || 0;
  const dateEnd = project.fecha_fin ? new Date(`${project.fecha_fin.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE') : 'Sin fecha de fin';
  return `<article class="project-card">
    <div class="card-top"><h3 class="project-title">${escapeHtml(project.titulo)}</h3><span class="badge status-${escapeHtml(project.estado)}">${escapeHtml(labels[project.estado] || project.estado)}</span></div>
    <p class="project-summary">${escapeHtml(project.resumen)}</p>
    <div class="meta-row">
      <span class="meta-item"><span aria-hidden="true">${icons.person}</span><b>${escapeHtml(project.investigador_principal)}</b></span>
      <span class="meta-item"><span aria-hidden="true">${icons.faculty}</span>${escapeHtml(project.facultad)}</span>
      <span class="meta-item"><span aria-hidden="true">${icons.line}</span>${escapeHtml(project.linea_investigacion)}</span>
      <span class="meta-item"><span aria-hidden="true">${icons.calendar}</span>${escapeHtml(String(project.fecha_inicio).slice(0, 10))} – ${escapeHtml(dateEnd)}</span>
    </div>
    <div class="progress-row"><div class="progress-track" role="progressbar" aria-label="Avance del proyecto" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${Math.min(100, Math.max(0, progress))}%"></div></div><span class="progress-text">${progress}%</span></div>
    <div class="card-actions"><button class="small-action" data-action="edit" data-id="${Number(project.id)}" type="button">Editar</button><button class="small-action danger" data-action="delete" data-id="${Number(project.id)}" type="button">Eliminar</button></div>
  </article>`;
}

function render() {
  updateSummary();
  const query = search.value.trim().toLocaleLowerCase('es');
  const status = statusFilter.value;
  const filtered = state.projects.filter((project) => {
    const searchable = [project.titulo, project.linea_investigacion, project.investigador_principal, project.facultad]
      .join(' ').toLocaleLowerCase('es');
    return (!query || searchable.includes(query)) && (!status || project.estado === status);
  });
  list.innerHTML = filtered.map(projectCard).join('');
  document.querySelector('#empty-state').hidden = filtered.length > 0;
}

async function loadProjects() {
  try {
    notice.hidden = true;
    state.projects = await api();
    render();
  } catch (error) {
    showNotice(`${error.message} Confirma que MySQL y el servidor de la API estén activos.`, 'error');
    list.innerHTML = '';
    updateSummary();
    document.querySelector('#empty-state').hidden = true;
  }
}

function openCreate() {
  form.reset();
  document.querySelector('#project-id').value = '';
  document.querySelector('#dialog-title').textContent = 'Nuevo proyecto';
  document.querySelector('#save-project').textContent = 'Guardar proyecto';
  document.querySelector('#progress-output').value = '0';
  errorBox.hidden = true;
  dialog.showModal();
}

function openEdit(id) {
  const project = state.projects.find((item) => Number(item.id) === Number(id));
  if (!project) return;
  document.querySelector('#project-id').value = project.id;
  document.querySelector('#dialog-title').textContent = 'Editar proyecto';
  document.querySelector('#save-project').textContent = 'Guardar cambios';
  for (const field of form.elements) {
    if (field.name && Object.prototype.hasOwnProperty.call(project, field.name)) {
      field.value = project[field.name] ?? '';
    }
  }
  document.querySelector('#progress-output').value = String(project.porcentaje_avance ?? 0);
  errorBox.hidden = true;
  dialog.showModal();
}

function formData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.porcentaje_avance = Number(data.porcentaje_avance);
  data.fecha_fin = data.fecha_fin || null;
  return data;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const id = document.querySelector('#project-id').value;
  const button = document.querySelector('#save-project');
  button.disabled = true;
  button.textContent = 'Guardando…';
  errorBox.hidden = true;
  try {
    await api(id ? `/${id}` : '', { method: id ? 'PUT' : 'POST', body: JSON.stringify(formData()) });
    dialog.close();
    await loadProjects();
    showNotice(id ? 'Los cambios del proyecto se guardaron.' : 'El proyecto se registró correctamente.', 'success');
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = id ? 'Guardar cambios' : 'Guardar proyecto';
  }
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'edit') return openEdit(id);
  const project = state.projects.find((item) => Number(item.id) === id);
  if (!project || !window.confirm(`¿Eliminar el proyecto “${project.titulo}”? Esta acción no se puede deshacer.`)) return;
  button.disabled = true;
  try {
    await api(`/${id}`, { method: 'DELETE' });
    await loadProjects();
    showNotice('El proyecto se eliminó correctamente.', 'success');
  } catch (error) {
    showNotice(error.message, 'error');
    button.disabled = false;
  }
});

document.querySelector('#new-project').addEventListener('click', openCreate);
document.querySelector('#empty-new').addEventListener('click', openCreate);
document.querySelector('#refresh-projects').addEventListener('click', loadProjects);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
document.querySelector('[name="porcentaje_avance"]').addEventListener('input', (event) => {
  document.querySelector('#progress-output').value = event.target.value;
});
search.addEventListener('input', render);
statusFilter.addEventListener('change', render);
loadProjects();

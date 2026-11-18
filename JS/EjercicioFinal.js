// ========== CONFIGURACIÓN SUPABASE ==========
// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO
const SUPABASE_URL = "https://zxjscasyxtqduhtlxaff.supabase.co";
const SUPABASE_CLAVE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4anNjYXN5eHRxZHVodGx4YWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTc3NTMsImV4cCI6MjEwOTU3Mzc1M30.eSATJWruZHruGkFe9Pj_ITfiVROTILdAuK3n2g7XRoc";

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLAVE);

// ========== ELEMENTOS DEL DOM ==========
const pantallaLogin = document.getElementById('pantalla-login');
const pantallaRegistro = document.getElementById('pantalla-registro');
const pantallaPrincipal = document.getElementById('pantalla-principal');

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const linkRegistro = document.getElementById('link-registro');
const linkLogin = document.getElementById('link-login');
const mensajeLogin = document.getElementById('mensaje-login');
const mensajeRegistro = document.getElementById('mensaje-registro');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

const listaDocumentos = document.getElementById('lista-documentos');
const tituloCategoria = document.getElementById('titulo-categoria');
const formSubir = document.getElementById('form-subir');
const buscador = document.getElementById('buscar-archivos');

const modalEditar = document.getElementById('modal-editar');
const formEditar = document.getElementById('form-editar');
const cerrarModal = document.querySelector('.cerrar');

const modalCurso = document.getElementById('modal-curso');
const btnFormCurso = document.getElementById('btn-form-curso');
const formCurso = document.getElementById('form-curso');
const cerrarModalCurso = document.querySelector('.cerrar-curso');

const categoriasLinks = document.querySelectorAll('[data-categoria]');

let usuarioActual = null;
let categoriaActiva = 'todos';
let todosLosDocs = [];

// ========== NAVEGACIÓN ==========
linkRegistro.addEventListener('click', e => {
  e.preventDefault();
  pantallaLogin.classList.remove('pantalla-activa');
  pantallaLogin.classList.add('oculto');
  pantallaRegistro.classList.add('pantalla-activa');
  pantallaRegistro.classList.remove('oculto');
});

linkLogin.addEventListener('click', e => {
  e.preventDefault();
  pantallaRegistro.classList.remove('pantalla-activa');
  pantallaRegistro.classList.add('oculto');
  pantallaLogin.classList.add('pantalla-activa');
  pantallaLogin.classList.remove('oculto');
});

// ========== AUTENTICACIÓN ==========
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  mensajeLogin.textContent = '';
  const correo = document.getElementById('correo').value;
  const contrasena = document.getElementById('contrasena').value;
  const { data, error } = await clienteSupabase.auth.signInWithPassword({ email: correo, password: contrasena });
  if (error) { mensajeLogin.textContent = '❌ ' + error.message; return; }
  usuarioActual = data.user;
  mostrarPantallaPrincipal();
});

formRegistro.addEventListener('submit', async e => {
  e.preventDefault();
  mensajeRegistro.textContent = '';
  const correo = document.getElementById('reg-correo').value;
  const contrasena = document.getElementById('reg-contrasena').value;
  const { data, error } = await clienteSupabase.auth.signUp({ email: correo, password: contrasena });
  if (error) { mensajeRegistro.textContent = '❌ ' + error.message; return; }
  mensajeRegistro.textContent = '✅ Cuenta creada. Revisa tu correo.';
});

btnCerrarSesion.addEventListener('click', async () => {
  await clienteSupabase.auth.signOut();
  usuarioActual = null;
  pantallaPrincipal.classList.add('oculto');
  pantallaLogin.classList.add('pantalla-activa');
  pantallaLogin.classList.remove('oculto');
  listaDocumentos.innerHTML = '';
});

window.addEventListener('load', async () => {
  const { data: { session } } = await clienteSupabase.auth.getSession();
  if (session) { usuarioActual = session.user; mostrarPantallaPrincipal(); }
  clienteSupabase.auth.onAuthStateChange((_, session) => {
    if (session) { usuarioActual = session.user; mostrarPantallaPrincipal(); }
    else { usuarioActual = null; }
  });
});

function mostrarPantallaPrincipal() {
  pantallaLogin.classList.remove('pantalla-activa');
  pantallaRegistro.classList.remove('pantalla-activa');
  pantallaLogin.classList.add('oculto');
  pantallaRegistro.classList.add('oculto');
  pantallaPrincipal.classList.remove('oculto');
  cargarDocumentos();
}

// ========== CATEGORÍAS ==========
categoriasLinks.forEach(link => {
  link.addEventListener('click', () => {
    categoriasLinks.forEach(l => l.classList.remove('categoria-activa'));
    link.classList.add('categoria-activa');
    categoriaActiva = link.dataset.categoria;
    const titulos = {
      todos: 'Todos los Documentos',
      privados: '🔒 Documentos Privados',
      academicos: '🎓 Documentos Académicos',
      cursos: '📚 Cursos de Actualización',
      familiares: '👨‍👩‍👧 Documentos Familiares'
    };
    tituloCategoria.textContent = titulos[categoriaActiva];
    renderizarDocumentos();
  });
});

// ========== CARGAR DOCUMENTOS ==========
async function cargarDocumentos() {
  if (!usuarioActual) return;
  const { data, error } = await clienteSupabase
    .from('documentos')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .order('fecha_subida', { ascending: false });
  if (error) { console.error(error); return; }
  todosLosDocs = data || [];
  renderizarDocumentos();
}

function renderizarDocumentos() {
  let docsFiltrados = categoriaActiva !== 'todos'
    ? todosLosDocs.filter(d => d.tipo_categoria === categoriaActiva)
    : [...todosLosDocs];
  const termino = buscador.value.toLowerCase().trim();
  if (termino) {
    docsFiltrados = docsFiltrados.filter(d =>
      d.nombre.toLowerCase().includes(termino) ||
      d.tipo_documento.toLowerCase().includes(termino) ||
      (d.descripcion && d.descripcion.toLowerCase().includes(termino))
    );
  }
  if (docsFiltrados.length === 0) {
    listaDocumentos.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#6b7280;padding:2rem;">📂 No hay documentos.</p>';
    return;
  }
  listaDocumentos.innerHTML = docsFiltrados.map(doc => `
    <div class="tarjeta-doc" data-id="${doc.id}">
      <h4>${escaparHTML(doc.nombre)}</h4>
      <span class="etiqueta">${escaparHTML(doc.tipo_documento)}</span>
      <span class="etiqueta">${formatearFecha(doc.fecha_subida)}</span>
      ${doc.descripcion ? `<p style="margin:0.5rem 0;font-size:0.9rem;color:#4b5563;">${escaparHTML(doc.descripcion)}</p>` : ''}
      <div class="botones-doc">
        ${doc.url_archivo ? `<button class="btn-ver" onclick="verArchivo('${doc.url_archivo}')">👁 Ver</button>` : ''}
        <button class="btn-editar" onclick="abrirModalEditar('${doc.id}')">✏ Editar</button>
        <button class="btn-eliminar" onclick="eliminarDocumento('${doc.id}', '${doc.ruta_archivo || ''}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}

buscador.addEventListener('input', renderizarDocumentos);

// ========== SUBIR DOCUMENTO ==========
formSubir.addEventListener('submit', async e => {
  e.preventDefault();
  if (!usuarioActual) return;
  const archivo = document.getElementById('archivo-input').files[0];
  const nombre = document.getElementById('nombre-doc').value.trim();
  const categoria = document.getElementById('categoria-doc').value;
  const tipo = document.getElementById('tipo-doc').value;
  const descripcion = document.getElementById('descripcion-doc').value.trim();
  let rutaArchivo = null, urlPublica = null;
  if (archivo) {
    const ext = archivo.name.split('.').pop();
    const nombreArchivo = `${Date.now()}.${ext}`;
    rutaArchivo = `${usuarioActual.id}/${nombreArchivo}`;
    const { error: eSubida } = await clienteSupabase.storage.from('archivos').upload(rutaArchivo, archivo);
    if (eSubida) { alert('❌ ' + eSubida.message); return; }
    const { data: { publicUrl } } = clienteSupabase.storage.from('archivos').getPublicUrl(rutaArchivo);
    urlPublica = publicUrl;
  }
  const { error } = await clienteSupabase.from('documentos').insert({
    usuario_id: usuarioActual.id, nombre, tipo_categoria: categoria,
    tipo_documento: tipo, descripcion: descripcion || null,
    url_archivo: urlPublica, ruta_archivo: rutaArchivo
  });
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ Guardado');
  formSubir.reset();
  cargarDocumentos();
});

// ========== ACCIONES ==========
function verArchivo(url) { window.open(url, '_blank'); }

async function eliminarDocumento(id, rutaArchivo) {
  if (!confirm('¿Eliminar?')) return;
  if (rutaArchivo) await clienteSupabase.storage.from('archivos').remove([rutaArchivo]);
  const { error } = await clienteSupabase.from('documentos').delete().eq('id', id);
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ Eliminado');
  cargarDocumentos();
}

async function abrirModalEditar(id) {
  const doc = todosLosDocs.find(d => d.id === id);
  if (!doc) return;
  document.getElementById('editar-id').value = doc.id;
  document.getElementById('editar-nombre').value = doc.nombre;
  document.getElementById('editar-categoria').value = doc.tipo_categoria;
  document.getElementById('editar-tipo').value = doc.tipo_documento;
  document.getElementById('editar-descripcion').value = doc.descripcion || '';
  modalEditar.classList.remove('oculto');
}

formEditar.addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('editar-id').value;
  const nombre = document.getElementById('editar-nombre').value.trim();
  const categoria = document.getElementById('editar-categoria').value;
  const tipo = document.getElementById('editar-tipo').value;
  const descripcion = document.getElementById('editar-descripcion').value.trim();
  const { error } = await clienteSupabase.from('documentos').update({
    nombre, tipo_categoria: categoria, tipo_documento: tipo,
    descripcion: descripcion || null
  }).eq('id', id);
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ Actualizado');
  modalEditar.classList.add('oculto');
  cargarDocumentos();
});

cerrarModal.addEventListener('click', () => modalEditar.classList.add('oculto'));
window.addEventListener('click', e => {
  if (e.target === modalEditar) modalEditar.classList.add('oculto');
  if (e.target === modalCurso) modalCurso.classList.add('oculto');
});

// ========== SOLICITUD CURSOS ==========
btnFormCurso.addEventListener('click', () => modalCurso.classList.remove('oculto'));
cerrarModalCurso.addEventListener('click', () => modalCurso.classList.add('oculto'));
formCurso.addEventListener('submit', async e => {
  e.preventDefault();
  if (!usuarioActual) return;
  const nombre = document.getElementById('curso-nombre').value.trim();
  const correo = document.getElementById('curso-correo').value.trim();
  const telefono = document.getElementById('curso-telefono').value.trim();
  const mensaje = document.getElementById('curso-mensaje').value.trim();
  const { error } = await clienteSupabase.from('solicitudes_cursos').insert({
    usuario_id: usuarioActual.id, nombre_completo: nombre,
    correo, telefono: telefono || null, mensaje
  });
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ Enviado');
  formCurso.reset();
  modalCurso.classList.add('oculto');
});

// ========== UTILIDADES ==========
function escaparHTML(texto) {
  const temp = document.createElement('div');
  temp.textContent = texto;
  return temp.innerHTML;
}
function formatearFecha(fechaISO) {
  return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

window.verArchivo = verArchivo;
window.abrirModalEditar = abrirModalEditar;
window.eliminarDocumento = eliminarDocumento;

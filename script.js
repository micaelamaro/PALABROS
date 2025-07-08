const palabras = [];
let indiceEditando = null;

const form = document.getElementById("formPalabra");
const listaPalabras = document.getElementById("listaPalabras");
const contenedor = document.getElementById("crucigrama");
const listaPistas = document.getElementById("pistas");
const resultado = document.getElementById("resultado");

// Mostrar/ocultar campos manuales
document.getElementById("modoManual").addEventListener("change", (e) => {
  document.getElementById("manualFields").style.display = e.target.checked ? "block" : "none";
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const palabra = document.getElementById("inputPalabra").value.trim().toUpperCase();
  const pista = document.getElementById("inputPista").value.trim();
  const usarManual = document.getElementById("modoManual").checked;

  let fila = null, col = null, direccion = null;

  if (usarManual) {
    fila = parseInt(document.getElementById("inputFila").value);
    col = parseInt(document.getElementById("inputCol").value);
    direccion = document.getElementById("inputDireccion").value;

    if (isNaN(fila) || isNaN(col) || !direccion) {
      alert("Ingresá ubicación válida (fila, columna y dirección).");
      return;
    }
  }

  if (indiceEditando !== null) {
    palabras[indiceEditando] = { palabra, pista };
    if (usarManual) {
      palabras[indiceEditando].fila = fila;
      palabras[indiceEditando].col = col;
      palabras[indiceEditando].direccion = direccion;
    }
    indiceEditando = null;
    document.getElementById("modoEdicion").style.display = "none";
  } else {
    const nueva = { palabra, pista };
    if (usarManual) {
      nueva.fila = fila;
      nueva.col = col;
      nueva.direccion = direccion;
    }
    palabras.push(nueva);
  }

  colocarPalabrasAutomatico(palabras);
  actualizarLista();
  generarCrucigrama();
  mostrarPistas();
  form.reset();
  document.getElementById("manualFields").style.display = "none";
  document.getElementById("modoManual").checked = false;
  resultado.textContent = "";
});

function actualizarLista() {
  listaPalabras.innerHTML = "";
  palabras.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.palabra} (${p.direccion || "-"}) - ${p.pista}
      <button onclick="editarPalabra(${i})">✏️</button>
      <button onclick="eliminarPalabra(${i})">🗑️</button>
    `;
    listaPalabras.appendChild(li);
  });
}

window.eliminarPalabra = function(index) {
  palabras.splice(index, 1);
  indiceEditando = null;
  document.getElementById("modoEdicion").style.display = "none";
  generarCrucigrama();
  actualizarLista();
  mostrarPistas();
};

window.editarPalabra = function(index) {
  const p = palabras[index];
  document.getElementById("inputPalabra").value = p.palabra;
  document.getElementById("inputPista").value = p.pista;
  indiceEditando = index;
  document.getElementById("modoEdicion").style.display = "inline";

  if (p.fila !== undefined && p.col !== undefined && p.direccion) {
    document.getElementById("modoManual").checked = true;
    document.getElementById("manualFields").style.display = "block";
    document.getElementById("inputFila").value = p.fila;
    document.getElementById("inputCol").value = p.col;
    document.getElementById("inputDireccion").value = p.direccion;
  } else {
    document.getElementById("modoManual").checked = false;
    document.getElementById("manualFields").style.display = "none";
  }
};

function colocarPalabrasAutomatico(lista) {
  const ubicadas = [];

  lista.forEach((p, idx) => {
    if (p.fila !== undefined && p.col !== undefined && p.direccion) {
      ubicadas.push(p);
      return;
    }

    if (ubicadas.length === 0) {
      p.fila = 5;
      p.col = 5;
      p.direccion = "H";
      ubicadas.push(p);
      return;
    }

    let colocada = false;

    for (let otra of ubicadas) {
      for (let i = 0; i < p.palabra.length; i++) {
        const letra = p.palabra[i];

        for (let j = 0; j < otra.palabra.length; j++) {
          if (letra === otra.palabra[j]) {
            let fila, col, direccion;

            if (otra.direccion === "H") {
              direccion = "V";
              fila = otra.fila - i;
              col = otra.col + j;
            } else {
              direccion = "H";
              fila = otra.fila + j;
              col = otra.col - i;
            }

            if (fila >= 0 && col >= 0) {
              p.fila = fila;
              p.col = col;
              p.direccion = direccion;
              ubicadas.push(p);
              colocada = true;
              break;
            }
          }
        }
        if (colocada) break;
      }
      if (colocada) break;
    }

    if (!colocada) {
      p.fila = 2 * idx;
      p.col = 0;
      p.direccion = "H";
      ubicadas.push(p);
    }
  });
}

function generarCrucigrama() {
  if (palabras.length === 0) return;

  const maxFila = Math.max(...palabras.map(p =>
    p.direccion === "H" ? p.fila : p.fila + p.palabra.length - 1
  ));
  const maxCol = Math.max(...palabras.map(p =>
    p.direccion === "H" ? p.col + p.palabra.length - 1 : p.col
  ));

  const TAM_FILA = maxFila + 1;
  const TAM_COL = maxCol + 1;

  const grilla = Array.from({ length: TAM_FILA }, () => Array(TAM_COL).fill(null));

  let numeroPista = 1;
  const posicionesConNumero = [];

  palabras.forEach(({ palabra, fila, col, direccion }, index) => {
    for (let i = 0; i < palabra.length; i++) {
      const letra = palabra[i];
      const f = direccion === "H" ? fila : fila + i;
      const c = direccion === "H" ? col + i : col;
      grilla[f][c] = letra;
    }

    posicionesConNumero.push({ fila, col, numero: numeroPista });
    palabras[index].numero = numeroPista;
    numeroPista++;
  });

  contenedor.style.gridTemplateColumns = `repeat(${TAM_COL}, 40px)`;
  contenedor.style.gridTemplateRows = `repeat(${TAM_FILA}, 40px)`;

  contenedor.innerHTML = "";

  for (let fila = 0; fila < TAM_FILA; fila++) {
    for (let col = 0; col < TAM_COL; col++) {
      const celdaWrapper = document.createElement("div");
      celdaWrapper.classList.add("celda-wrapper");

      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.classList.add("celda");

      if (grilla[fila][col] === null) {
        input.disabled = true;
        input.classList.add("vacia");
      } else {
        input.dataset.fila = fila;
        input.dataset.col = col;
      }

      const posicionNumerada = posicionesConNumero.find(p => p.fila === fila && p.col === col);
      if (posicionNumerada) {
        const numero = document.createElement("div");
        numero.classList.add("numero");
        numero.textContent = posicionNumerada.numero;
        celdaWrapper.appendChild(numero);
      }

      celdaWrapper.appendChild(input);
      contenedor.appendChild(celdaWrapper);
    }
  }
contenedor.addEventListener("keydown", (e) => {
  const input = e.target;
  if (input.tagName !== "INPUT" || input.disabled) return;

  const fila = parseInt(input.dataset.fila);
  const col = parseInt(input.dataset.col);

  // Mover al siguiente casillero con flechas
  let nextInput;
  switch (e.key) {
    case "ArrowUp":
      nextInput = document.querySelector(`input[data-fila="${fila - 1}"][data-col="${col}"]`);
      break;
    case "ArrowDown":
      nextInput = document.querySelector(`input[data-fila="${fila + 1}"][data-col="${col}"]`);
      break;
    case "ArrowLeft":
      nextInput = document.querySelector(`input[data-fila="${fila}"][data-col="${col - 1}"]`);
      break;
    case "ArrowRight":
      nextInput = document.querySelector(`input[data-fila="${fila}"][data-col="${col + 1}"]`);
      break;
    case "Enter":
      e.preventDefault();
      // Ir al siguiente input válido
      const inputs = Array.from(contenedor.querySelectorAll("input:not([disabled])"));
      const indexActual = inputs.indexOf(input);
      const indexSiguiente = (indexActual + 1) % inputs.length;
      inputs[indexSiguiente].focus();
      return;
    default:
      return;
  }

  if (nextInput) {
    e.preventDefault();
    nextInput.focus();
  }
});

// Salto automático después de escribir una letra
contenedor.addEventListener("input", (e) => {
  const input = e.target;
  if (input.tagName !== "INPUT" || input.disabled) return;
  if (input.value.length === 1) {
    const fila = parseInt(input.dataset.fila);
    const col = parseInt(input.dataset.col);

    // Buscamos la palabra en la que está esta celda
    const palabraActual = palabras.find(p => {
      for (let i = 0; i < p.palabra.length; i++) {
        const f = p.direccion === "H" ? p.fila : p.fila + i;
        const c = p.direccion === "H" ? p.col + i : p.col;
        if (f === fila && c === col) return true;
      }
      return false;
    });

    if (palabraActual) {
      const i = palabraActual.palabra.split('').findIndex((_, idx) => {
        const f = palabraActual.direccion === "H" ? palabraActual.fila : palabraActual.fila + idx;
        const c = palabraActual.direccion === "H" ? palabraActual.col + idx : palabraActual.col;
        return f === fila && c === col;
      });

      const nextFila = palabraActual.direccion === "H" ? fila : fila + 1;
      const nextCol = palabraActual.direccion === "H" ? col + 1 : col;

      const nextInput = document.querySelector(`input[data-fila="${nextFila}"][data-col="${nextCol}"]`);
      if (nextInput && !nextInput.disabled) nextInput.focus();
    }
  }
});

  contenedor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const input = e.target;
      if (input.tagName !== "INPUT" || input.disabled) return;
      e.preventDefault();
      const inputs = Array.from(contenedor.querySelectorAll("input:not([disabled])"));
      const indexActual = inputs.indexOf(input);
      const indexSiguiente = (indexActual + 1) % inputs.length;
      inputs[indexSiguiente].focus();
    }
  });

  window.__grillaVerificacion = grilla;
}

function mostrarPistas() {
  listaPistas.innerHTML = "";
  palabras.forEach(p => {
    const item = document.createElement("li");
    item.textContent = `${p.numero}. (${p.direccion}) ${p.pista}`;
    listaPistas.appendChild(item);
  });
}

document.getElementById("verificar").addEventListener("click", () => {
  const inputs = document.querySelectorAll("#crucigrama input:not([disabled])");
  let correcto = true;

  inputs.forEach(input => {
    const fila = parseInt(input.dataset.fila);
    const col = parseInt(input.dataset.col);
    const letraCorrecta = window.__grillaVerificacion[fila][col];
    const letraIngresada = input.value.toUpperCase();

    if (letraIngresada !== letraCorrecta) {
      correcto = false;
      input.style.backgroundColor = "#fbb";
    } else {
      input.style.backgroundColor = "#bdf";
    }
  });

  resultado.textContent = correcto
    ? "✅ ¡Muy bien! Completaste el crucigrama correctamente."
    : "❌ Hay errores. Revisá las letras marcadas.";
});

function resaltarPalabra(fila, col) {
  // Limpiar anteriores
  document.querySelectorAll(".celda.resaltada").forEach(el => {
    el.classList.remove("resaltada");
  });

  const palabraActual = palabras.find(p => {
    for (let i = 0; i < p.palabra.length; i++) {
      const f = p.direccion === "H" ? p.fila : p.fila + i;
      const c = p.direccion === "H" ? p.col + i : p.col;
      if (f === fila && c === col) return true;
    }
    return false;
  });

  if (palabraActual) {
    for (let i = 0; i < palabraActual.palabra.length; i++) {
      const f = palabraActual.direccion === "H" ? palabraActual.fila : palabraActual.fila + i;
      const c = palabraActual.direccion === "H" ? palabraActual.col + i : palabraActual.col;
      const celda = document.querySelector(`input[data-fila="${f}"][data-col="${c}"]`);
      if (celda) celda.classList.add("resaltada");
    }
  }
}

// GUARDAR JSON
document.getElementById("guardarJSON").addEventListener("click", () => {
  const json = JSON.stringify(palabras, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crucigrama.json";
  a.click();
  URL.revokeObjectURL(url);
});

// CARGAR JSON
document.getElementById("cargarJSON").addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (event) => {
    try {
      const datos = JSON.parse(event.target.result);
      if (Array.isArray(datos)) {
        palabras.length = 0; // limpiar array actual
        datos.forEach(p => palabras.push(p));
        actualizarLista();
        generarCrucigrama(palabras);
      } else {
        alert("El archivo no contiene un crucigrama válido.");
      }
    } catch (err) {
      alert("Error al leer el archivo JSON.");
    }
  };
  lector.readAsText(archivo);
});






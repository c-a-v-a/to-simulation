// src/SimulationMemento.ts
class SimulationMemento {
  n;
  m;
  i;
  specimens;
  proximity;
  sick;
  constructor(n, m, i, specimens, proximity, sick) {
    this.n = n;
    this.m = m;
    this.i = i;
    this.specimens = specimens;
    this.proximity = proximity;
    this.sick = sick;
  }
}

// src/SpecimenState.ts
class SpecimenState {
  getName() {
    return this.name;
  }
}

// src/SpecimenHealthyState.ts
class SpecimenHealthyState extends SpecimenState {
  name = "healthy";
  handle(specimen) {
    return;
  }
}

// src/SpecimenSymptomaticState.ts
class SpecimenSymptomaticState extends SpecimenState {
  name = "symptomatic";
  handle(specimen) {
    if (Math.random() > 0.5) {
      specimen.setState(new SpecimenInfectedState);
    } else {
      specimen.setState(new SpecimenSymptomaticState);
    }
  }
}

// src/SpecimenInfectedState.ts
class SpecimenInfectedState extends SpecimenState {
  name = "infected";
  handle(specimen) {
    if (Math.random() > 0.5) {
      return;
    }
    if (Math.random() > 0.5) {
      specimen.setState(new SpecimenInfectedState);
    } else {
      specimen.setState(new SpecimenSymptomaticState);
    }
  }
}

// src/SpecimenResistantState.ts
class SpecimenResistantState extends SpecimenState {
  name = "resistant";
  handle(specimen) {
    return;
  }
}

// src/Vector2DPolar.ts
class Vector2DPolar {
  angle;
  length;
  constructor(angle, length) {
    this.angle = angle;
    this.length = length;
  }
  getX() {
    return this.length * Math.cos(this.angle);
  }
  getY() {
    return this.length * Math.sin(this.angle);
  }
}

// src/Specimen.ts
class Specimen {
  static counter = 0;
  id;
  x;
  y;
  state;
  vector;
  constructor(x, y, angle) {
    this.id = Specimen.counter;
    this.x = x;
    this.y = y;
    this.vector = new Vector2DPolar(angle, Math.random() * 0.1);
    this.state = new SpecimenHealthyState;
    if (Math.random() < 0.1) {
      if (Math.random() > 0.5) {
        this.setState(new SpecimenInfectedState);
      } else {
        this.setState(new SpecimenSymptomaticState);
      }
    }
    Specimen.incrementCounter();
  }
  fromJSON(x, y, angle, length, state) {
    this.x = x;
    this.y = y;
    this.vector = new Vector2DPolar(angle, length);
    switch (state) {
      case "infected":
        this.state = new SpecimenInfectedState;
        break;
      case "healthy":
        this.state = new SpecimenHealthyState;
        break;
      case "resistant":
        this.state = new SpecimenResistantState;
        break;
      case "symptomatic":
        this.state = new SpecimenSymptomaticState;
        break;
    }
  }
  static incrementCounter() {
    this.counter++;
  }
  getId() {
    return this.id;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  getState() {
    return this.state;
  }
  setState(state) {
    if (this.state.getName() === "resistant") {
      return;
    }
    if ((state.getName() === "infected" || state.getName() === "symptomatic") && (this.state.getName() === "resistant" || this.state.getName() === "symptomatic")) {
      return;
    }
    this.state = state;
  }
  move() {
    this.x += this.vector.getX();
    this.y += this.vector.getY();
    if (Math.random() > 0.75) {
      this.setNewVector();
    }
  }
  isInBorders(n, m) {
    return this.x > 0 && this.x < n && this.y > 0 && this.y < m;
  }
  setNewVector() {
    this.vector = new Vector2DPolar(Math.random() * 2 * Math.PI, Math.random() * 0.1);
  }
}

// src/Simulation.ts
class Simulation {
  n;
  m;
  i;
  specimens = [];
  proximity = {};
  sick = {};
  constructor(n, m, i) {
    this.n = n;
    this.m = m;
    this.i = i;
    for (let i2 = 0;i2 < this.i; i2++) {
      const specimen = new Specimen(Math.random() * this.n, Math.random() * this.m, Math.random() * 2 * Math.PI);
      if (specimen.getState().getName() === "infected" || specimen.getState().getName() === "symptomatic") {
        this.sick[specimen.getId()] = 0;
      }
      this.specimens.push(specimen);
    }
  }
  getN() {
    return this.n;
  }
  getM() {
    return this.m;
  }
  getI() {
    return this.i;
  }
  getSpecimens() {
    return this.specimens;
  }
  spawnNewSpecimen() {
    for (let i = 0;i < this.i * 0.1; i++) {
      const spawnPosition = Math.floor(Math.random() * 4);
      let angle;
      switch (spawnPosition) {
        case 0 /* LEFT */:
          if (Math.random() > 0.5) {
            angle = Math.random() * 0.5 * Math.PI;
          } else {
            angle = Math.random() * 2 * Math.PI + 1.5 * Math.PI;
          }
          this.specimens.push(new Specimen(0, Math.random() * this.m, angle));
          break;
        case 1 /* UP */:
          angle = Math.random() * 2 * Math.PI + Math.PI;
          this.specimens.push(new Specimen(Math.random() * this.n, 0, angle));
          break;
        case 2 /* RIGHT */:
          angle = Math.random() * 1.5 * Math.PI + 0.5 * Math.PI;
          this.specimens.push(new Specimen(this.n, Math.random() * this.m, angle));
          break;
        case 3 /* DOWN */:
          angle = Math.random() * Math.PI;
          this.specimens.push(new Specimen(Math.random() * this.n, this.m, angle));
          break;
      }
    }
  }
  step(dt) {
    for (let i = 0;i < this.specimens.length; i++) {
      const specimen = this.specimens[i];
      specimen?.move();
      if (!specimen?.isInBorders(this.n, this.m)) {
        if (Math.random() > 0.5) {
          specimen?.setNewVector();
        } else {
          this.specimens.splice(i, 1);
        }
      }
    }
    for (let i = 0;i < this.specimens.length; i++) {
      const first = this.specimens[i];
      if (first.getState().getName() !== "infected" && first.getState().getName() !== "symptomatic") {
        continue;
      }
      for (let j = 0;j < this.specimens.length; j++) {
        if (i === j) {
          continue;
        }
        const second = this.specimens[j];
        const dx = first.getX() - second.getX();
        const dy = first.getY() - second.getY();
        const distance = Math.sqrt(dx * dx + dy * dy);
        const key = `${first.getId()}-${second.getId()}`;
        if (distance <= 2) {
          this.proximity[key] = (this.proximity[key] || 0) + dt;
          if (this.proximity[key] > 3000) {
            const prevState = second.getState();
            first.getState().handle(second);
            if (prevState.getName() !== second.getState().getName() && (second.getState().getName() === "infected" || second.getState().getName() === "symptomatic")) {
              this.sick[second.getId()] = 0;
            }
          }
        } else {
          delete this.proximity[key];
        }
      }
    }
    for (let key in this.sick) {
      this.sick[key] += dt;
      if (Math.random() * 1e4 + 20000 < this.sick[key]) {
        const specimen = this.specimens.find((x) => x.getId() === Number(key));
        specimen?.setState(new SpecimenResistantState);
        delete this.sick[key];
      }
    }
  }
  snapshot() {
    const specimenCopy = JSON.parse(JSON.stringify(this.specimens));
    const proximityCopy = JSON.parse(JSON.stringify(this.proximity));
    const sickCopy = JSON.parse(JSON.stringify(this.sick));
    return new SimulationMemento(this.n, this.m, this.i, specimenCopy, proximityCopy, sickCopy);
  }
  restore(snapshot) {
    console.log(snapshot);
    this.n = snapshot.n;
    this.m = snapshot.m;
    this.i = snapshot.i;
    this.specimens = snapshot.specimens;
    this.proximity = JSON.parse(JSON.stringify(snapshot.proximity));
    this.sick = JSON.parse(JSON.stringify(snapshot.sick));
  }
}

// src/SimulationHistory.ts
class SimulationHistory {
  history = [];
  add(snapshot) {
    this.history.push(snapshot);
  }
  peek() {
    return this.history[this.history.length - 1];
  }
  get(index) {
    return this.history[index];
  }
  getLength() {
    return this.history.length - 1;
  }
  toJSON() {
    return JSON.stringify(this.history, null, 2);
  }
  fromJSON(json) {
    const parsed = JSON.parse(json);
    this.history = parsed.map((x) => {
      const specimens = x.specimens.map((spec) => {
        const specimen = new Specimen(0, 0, 0);
        specimen.fromJSON(spec.x, spec.y, spec.vector.angle, spec.vector.length, spec.state.name);
        return specimen;
      });
      return new SimulationMemento(x.n, x.m, x.i, specimens, x.proximity, x.sick);
    });
  }
}

// src/index.ts
var simulation = new Simulation(100, 100, 100);
var history = new SimulationHistory;
var isRunning = false;
var interval = null;
var intervalDelta = 1000 / 25;
function start() {
  const canvas = document.getElementById("canvas");
  canvas.width = simulation.getN() / simulation.getM() * 1000;
  let fromLastUpdate = 0;
  let fromLastSpawned = 0;
  let t = 0;
  isRunning = true;
  interval = setInterval(() => {
    if (!isRunning && fromLastUpdate >= 1000) {
      return;
    }
    simulation.step(intervalDelta);
    draw(simulation.getSpecimens(), simulation.getN(), simulation.getM());
    infoText(simulation.getSpecimens(), t);
    if (fromLastUpdate >= 1000) {
      fromLastUpdate -= 1000;
      t++;
      history.add(simulation.snapshot());
    }
    if (fromLastSpawned >= 5 * simulation.getI()) {
      fromLastSpawned -= 5 * simulation.getI();
      simulation.spawnNewSpecimen();
    }
    fromLastUpdate += intervalDelta;
    fromLastSpawned += intervalDelta;
  }, intervalDelta);
}
function stop() {
  if (interval === null) {
    return;
  }
  clearInterval(interval);
  interval = null;
  isRunning = false;
}
function infoText(specimens, t) {
  const healthy = specimens.filter((x) => x.getState().getName() === "healthy").length;
  const resistant = specimens.filter((x) => x.getState().getName() === "resistant").length;
  const infected = specimens.filter((x) => x.getState().getName() === "infected").length;
  const symptomatic = specimens.filter((x) => x.getState().getName() === "symptomatic").length;
  document.getElementById("info").innerText = `T: ${t}s | Total: ${specimens.length} | Healthy: ${healthy} | Resistant: ${resistant} | Infected: ${infected} | Symptomatic: ${symptomatic}`;
}
function draw(specimens, n, m) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let specimen of specimens) {
    switch (specimen.getState().getName()) {
      case "healthy":
        ctx.fillStyle = "green";
        break;
      case "infected":
        ctx.fillStyle = "purple";
        break;
      case "resistant":
        ctx.fillStyle = "blue";
        break;
      case "symptomatic":
        ctx.fillStyle = "red";
        break;
    }
    ctx.beginPath();
    ctx.arc(specimen.getX() / n * canvas.width, specimen.getY() / m * canvas.height, 5, 0, Math.PI * 2);
    ctx.fill();
    if (specimen.getState().getName() === "symptomatic" || specimen.getState().getName() === "infected") {
      ctx.beginPath();
      ctx.arc(specimen.getX() / n * canvas.width, specimen.getY() / m * canvas.height, 2 / m * canvas.height, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
function openDB(callback) {
  const request = indexedDB.open("MyDatabase", 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("history")) {
      db.createObjectStore("history");
    }
  };
  request.onsuccess = () => callback(request.result);
  request.onerror = () => console.error("DB open error:", request.error);
}
function loadJson(callback) {
  openDB((db) => {
    const tx = db.transaction("history", "readonly");
    const store = tx.objectStore("history");
    const req = store.get("app-data");
    req.onsuccess = () => callback(req.result ?? null);
    req.onerror = () => {
      console.error("Load error:", req.error);
      callback(null);
    };
  });
}
document.getElementById("start-button").onclick = () => start();
document.getElementById("stop-button").onclick = () => stop();
document.getElementById("settings-button").onclick = () => {
  const n = parseInt(prompt(`N:`, `100`) ?? "");
  const m = parseInt(prompt(`M:`, `100`) ?? "");
  const i = parseInt(prompt(`I:`, `100`) ?? "");
  if (!n || !m || !i || n < 0 || m < 0 || i < 0) {
    alert("Invalid parameters. Simulation will run with defaults.");
    return;
  }
  simulation = new Simulation(n, m, i);
  alert("Settings saved.");
};
document.getElementById("save-button").onclick = () => {
  openDB((db) => {
    const tx = db.transaction("history", "readwrite");
    const store = tx.objectStore("history");
    store.put(history.toJSON(), "app-data");
    tx.oncomplete = () => alert("Saved history.");
    tx.onerror = () => console.error("Save error:", tx.error);
  });
};
document.getElementById("load-button").onclick = () => {
  stop();
  loadJson((json) => {
    if (!json) {
      alert("Failed to load the history. Probably not saved.");
      return;
    }
    history.fromJSON(json);
    const input = prompt(`Select the time to load from 0 to ${history.getLength()}`, `${history.getLength()}`);
    if (!input) {
      alert("Could not load history.");
      return;
    }
    const index = parseInt(input, 10);
    if (index < 0 || index > history.getLength()) {
      alert("Could not load history. Invalid input.");
      return;
    }
    simulation.restore(history.get(index));
  });
};

import { Pane } from "https://esm.sh/tweakpane";

const USED_LOCALSTORAGE_KEY = 'fouierTransformDrawing';
let step = 0.000004;
const svg = document.getElementById("svg");

const settings = restoreSettings();

const pane = new Pane({ container: document.getElementById("pane-container") });

const propSettings = {
	"R": { min: 5, max: 320, step },
	"r": { min: 0.01, max: 3, step },
	"d": { min: -110, max: 110, step: 2 },
	"nPoints": { min: 10, max: 2000, step: 10 }
}

const standardFolder = pane.addFolder({
  title: 'Settings'
});

standardFolder.addBinding(settings, "R", { ...propSettings.R });
standardFolder.addBinding(settings, "r", { ...propSettings.r });
standardFolder.addBinding(settings, "d", { ...propSettings.d});
standardFolder.addBinding(settings, "nPoints", { ...propSettings.nPoints });
standardFolder.addBinding(settings, "stroke", {
	picker: "inline",
	expanded: true
});
var sda = standardFolder.addBinding(settings, "sda")
var sdaElement = sda.controller.view.valueElement.querySelector('input');
sdaElement.addEventListener('input', (e) => {
	settings.sda = e.target.value;
	if (!settings.animate) {
		saveSettingsToLocalstorage();
	drawEpicycloid(settings);
	}
})


const animationFolder = pane.addFolder({
  title: 'Animation',
  expanded: settings.animate
});

const btnAnimate = animationFolder.addButton({
	title: settings.animate ? "Stop animation" : "Start animation"
});
animationFolder.addBinding(settings, "aR", {min: -propSettings.R.step*10, max: propSettings.R.step*10, step: propSettings.R.step});
animationFolder.addBinding(settings, "ar", {min: -propSettings.r.step*10, max: propSettings.r.step*10, step: propSettings.r.step});

const btnShareSVG = pane.addButton({
	title: "Copy SVG"
});
const btnShareLink = pane.addButton({
	title: "Copy link"
});

btnAnimate.on("click", () => {
	settings.animate  = !settings.animate;
	btnAnimate.title = settings.animate ? "Stop animation" : "Start animation";
	saveSettingsToLocalstorage();
});
btnShareSVG.on("click", () => {
	copyToClipboard("SVG copied to clipboard", svg.outerHTML);
});
btnShareLink.on("click", () => {
	copyToClipboard("Link to this object copied to clipboard", getURL());
});

pane.on("change", () => {
	saveSettingsToLocalstorage();
	drawEpicycloid(settings);
});

function saveSettingsToLocalstorage() {
	localStorage.setItem(USED_LOCALSTORAGE_KEY, JSON.stringify(settings))
}

function getSettingsFromLocalstorage() {
	return JSON.parse(localStorage.getItem(USED_LOCALSTORAGE_KEY));
}

function copyToClipboard(infoText, data) {
	navigator.clipboard
		.writeText(data)
		.then(() => {
			showInfo(infoText);
		})
		.catch((err) => {
			console.error("Failed to copy DATA: ", err);
		});
}

function drawEpicycloid(settings) {
	const { R, r, d, nPoints } = settings;
	svg.innerHTML = ""; // Clear previous drawing
	const points = [];

	for (let t = 0; t < Math.PI * 2; t += (Math.PI * 2) / nPoints) {
		const x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
		const y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
		points.push({ x: x + svg.clientWidth / 2, y: y + svg.clientHeight / 2 });
	}

	const pathData =
		points
			.map((point, index) => {
				return `${index === 0 ? "M" : "L"} ${point.x},${point.y}`;
			})
			.join(" ") + " Z";

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute("d", pathData);
	path.setAttribute("stroke", `${settings.stroke}99`);
	path.setAttribute("stroke-width", ".4");
  path.setAttribute("stroke-dasharray", settings.sda);
	path.setAttribute("fill", "none");
	let url = getURL();
	path.setAttribute("xlink:href", url);
	svg.appendChild(path);
	svg.innerHTML =
		svg.innerHTML +
		`
	<!-- ${url} -->`;
}

function showInfo(txt) {
	info.innerHTML = txt;
	info.showModal();
	setTimeout(() => {
		info.close();
	}, 1500);
}

function getURL() {
	const queryString = new URLSearchParams(settings).toString();
	const newURL = `https://codepen.io/netsi1964/pen/JjqyXbd?editors=1010&${queryString}`;
	return newURL;
}

function getSettingsFromURL() {
	let params =  new URLSearchParams(window.location.search);
	const _step = parseFloat(params.get('step'));
	return {
		R: parseFloat(params.get('R')),
		r: parseFloat(params.get('r')),
		d: parseFloat(params.get('d')),
		nPoints: parseFloat(params.get('nPoints')),
		stroke: params.get('stroke'),
		animate: !!params.get('animate'),
		aR: parseFloat(params.get('aR')),
		ar: -parseFloat(params.get('ar')),
		ad: parseFloat(params.get('ad')),
		sda: params.get('sda'),
	};

}

function restoreSettings() {
	const paramsFromURL = getSettingsFromURL();
	const settingsStoredLocally = getSettingsFromLocalstorage();
	const defaultSettings = {
		R: 150,
		r: 0.53,
		d: 80,
		nPoints: 1000,
		stroke: "#434a95",
		animate: true,
		aR: step,
		ar: -step,
		ad: step*100,
		sda: "1 1 2 3 5 8 13 21 34 55"
	}
	// , ...settingsStoredLocally, ...paramsFromURL
	return { ...defaultSettings };
}

function animate() {
	if (settings.animate) {
		stepAnimate('R');
		stepAnimate('r');
		stepAnimate('d');
		drawEpicycloid(settings);
		pane.refresh();
	}
	requestAnimationFrame(animate);
}
animate();

function stepAnimate(prop) {
	let set = settings[prop];
	let animationStep = settings[`a${prop}`];
	let propertySetting = propSettings[prop];
	settings[prop] += animationStep;
	if (settings[prop] > propertySetting.max || settings[prop] < propertySetting.min)   {
		settings[`a${prop}`] = -settings[`a${prop}`];
		settings[prop] += animationStep;
	}
}
// Initial draw
drawEpicycloid(settings);
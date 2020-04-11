import { WebGLHelper } from "./sys/webgl";
import { Application } from "./app";

if (WebGLHelper.isWebGLAvailable()) {
	const app = new Application();
	app.start();
} else {
    const message = 'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.';
    const element = document.createElement('div');
	element.style.fontFamily = 'monospace';
	element.style.fontSize = '13px';
	element.style.fontWeight = 'normal';
	element.style.textAlign = 'center';
	element.style.background = '#fff';
	element.style.color = '#000';
	element.style.padding = '1.5em';
	element.style.width = '400px';
    element.style.margin = '5em auto 0';
    element.innerHTML = message;
    document.body.appendChild(element);
}

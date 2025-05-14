import "reflect-metadata";
import "./index.css";
import { Application } from "@/app";

function main(): void {
  const app = new Application();
  app.init();
  app.start();
}

jQuery(() => main());

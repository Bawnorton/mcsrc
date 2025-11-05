import JSZip, { file } from 'jszip';
import { useState } from 'react';
import { decompile } from './vf'

const MINECRAFT_JAR_URL = "https://piston-data.mojang.com/v1/objects/26551033b7b935436f3407b85d14cac835e65640/client.jar";

var MC_JAR: JSZip | null = null;

async function downloadMinecraftJar(): Promise<Blob> {
  const response = await fetch(MINECRAFT_JAR_URL);
  if (!response.ok) {
    throw new Error(`Failed to download Minecraft jar: ${response.statusText}`);
  }
  return response.blob();
}

async function listJarContents(jarBlob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(jarBlob);
  MC_JAR = zip;
  return Object.keys(zip.files).filter(fileName => fileName.endsWith('.class'));
}

function App() {
  const [jarContents, setJarContents] = useState<string[]>([]);
  const [sourceCode, setSourceCode] = useState<string>("");

  const doLoad = async () => {
    try {
      const jarBlob = await downloadMinecraftJar();
      const contents = await listJarContents(jarBlob);
      setJarContents(contents);
    } catch (error) {
      console.error("Error loading Minecraft jar:", error);
    }
  };

  const decompileClassFile = async (className: string) => {
    if (!MC_JAR) {
      throw new Error("Minecraft jar not loaded");
    }

    let source = await decompile(className.replace(".class", ""), {
      source: async (name: string) => {
        if (!MC_JAR) {
          throw new Error("Minecraft jar not loaded");
        }
        console.log(`Fetching class file from jar: ${name}`);
        const file = MC_JAR.file(name + ".class");
        if (file) {
          const arrayBuffer = await file.async("arraybuffer");
          return new Uint8Array(arrayBuffer);
        }
        console.error(`File not found in Minecraft jar: ${name}`);
        return null;
      },
      resources: Object.keys(MC_JAR.files).filter(f => f.endsWith('.class')).map(f => f.replace(".class", "")),
    });

    setSourceCode(source);
  }

  return (
    <>
      <button onClick={doLoad}>Load</button>

      <p>{sourceCode}</p>

      <ul>
        {jarContents.map((fileName, index) => (
          <a key={index} href="#" onClick={async (e) => {
            e.preventDefault();
            await decompileClassFile(fileName);
            window.scrollTo(0, 0);
          }}>
            <li>{fileName}</li>
          </a>
        ))}
      </ul>
    </>
  )
}

export default App

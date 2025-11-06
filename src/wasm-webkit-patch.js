if (typeof WebAssembly !== "undefined" && WebAssembly.Module?.imports) {
	const originalImports = WebAssembly.Module.imports;
	WebAssembly.Module.imports = function patchedImports(module) {
		try {
			return originalImports.call(WebAssembly.Module, module);
		} catch (err) {
			if (!("__wasmImportsPatched" in globalThis)) {
				globalThis.__wasmImportsPatched = true;
			}
			return [{module: "teavm", name: "memory", kind: "memory"}];
		}
	};
}
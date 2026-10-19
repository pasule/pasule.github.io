import { getImage } from "astro:assets";

type RemoteImage = {
	src: string;
	srcset?: string;
	width?: number;
	height?: number;
};

const metadata = new Map<string, ReturnType<typeof getImage>>();
const variants = new Map<string, Promise<RemoteImage>>();

/** Build-time derivatives are emitted into /_astro and served by the site's CDN. */
export function getRemoteImage(
	src: string,
	widths: number[],
	quality = 78,
	square = false,
): Promise<RemoteImage> {
	if (!src.startsWith("https://") || !URL.canParse(src))
		return Promise.resolve({ src });
	const key = JSON.stringify([src, widths, quality, square]);
	let pending = variants.get(key);
	if (!pending) {
		pending = optimize(src, widths, quality, square);
		variants.set(key, pending);
	}
	return pending;
}

async function optimize(
	src: string,
	widths: number[],
	quality: number,
	square: boolean,
): Promise<RemoteImage> {
	let resolvedSrc = src;
	try {
		// Resolve random APIs once; metadata and all variants must use the same image.
		const initial = new URL(resolvedSrc);
		if (initial.hostname === "t.alcy.cc" && initial.pathname === "/pc") {
			const response = await fetch(resolvedSrc, {
				method: "HEAD",
				redirect: "manual",
				signal: AbortSignal.timeout(10000),
			});
			const location = response.headers.get("location");
			if (location) {
				const target = new URL(location, resolvedSrc);
				if (target.protocol === "https:" && target.hostname === "t.alcy.cc") {
					resolvedSrc = target.href;
				}
			}
		}
		let probe = metadata.get(resolvedSrc);
		if (!probe) {
			// Do not read .src here: probing should not emit a full-sized original.
			probe = getImage({ src: resolvedSrc, inferSize: true, layout: "none" });
			metadata.set(resolvedSrc, probe);
		}
		const original = (await probe).options;
		// Keep vectors/animations intact; never enable unsafe SVG rasterization globally.
		if (
			original.format === "svg" ||
			new URL(resolvedSrc).pathname.endsWith(".gif")
		) {
			return { src };
		}
		const originalWidth = Number(original.width);
		const originalHeight = Number(original.height);
		const candidates = [
			...new Set(widths.map((width) => Math.min(width, originalWidth))),
		];
		const width = candidates.at(-1) || originalWidth;
		const height = square
			? width
			: Math.round((width * originalHeight) / originalWidth);
		const image = await getImage({
			src: resolvedSrc,
			width,
			height,
			widths: candidates,
			format: "webp",
			quality: Math.min(quality, 80),
			fit: square ? "cover" : "contain",
			layout: "none",
		});
		return { src: image.src, srcset: image.srcSet.attribute, width, height };
	} catch {
		// A third-party outage or unsupported host must not break the entire site.
		console.warn(
			`[images] Keeping original URL; unable to optimize ${new URL(src).hostname}`,
		);
		return { src };
	}
}

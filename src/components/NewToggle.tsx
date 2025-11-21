"use client";

interface SliderV1Props {
	checked: boolean;
	onChange: (checked: boolean) => void;
	id: string;
}

export function SliderV1({ checked, onChange, id }: SliderV1Props) {
	return (
		<div className="relative scale-75">
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="absolute left-[-9999px]"
			/>
			<label
				htmlFor={id}
				className="relative block w-[5.5em] h-[3em] cursor-pointer rounded-[1.5em] transition-all duration-350 bg-linear-to-b from-white/5 to-transparent dark:from-black/20 dark:to-white/5 bg-[#3a3a3a] shadow-[0_0.07em_0.1em_-0.1em_rgba(0,0,0,0.6)_inset,0_0.05em_0.08em_-0.01em_rgba(255,255,255,0.15)]"
			>
				{/* Switch */}
				<span
					className="absolute w-[2em] h-[2em] top-[0.5em] left-[0.5em] rounded-full transition-all duration-250 ease-in-out bg-linear-to-b from-[#555] to-[#444] shadow-[0_0.1em_0.15em_-0.05em_rgba(255,255,255,0.2)_inset,0_0.5em_0.3em_-0.1em_rgba(0,0,0,0.5)] data-[checked=true]:left-[3em]"
					data-checked={checked}
				/>

				{/* Markers */}
				<span
					className="absolute w-[1em] h-[1em] top-[1em] left-[6em] rounded-full transition-all duration-250 ease-in bg-linear-to-b from-black/20 to-white/10 bg-[#3a3a3a] shadow-[0_0.08em_0.15em_-0.1em_rgba(0,0,0,0.7)_inset,0_0.05em_0.08em_-0.01em_rgba(255,255,255,0.15),-7.25em_0_0_-0.25em_rgba(0,0,0,0.5)] data-[checked=true]:bg-[#4c6] data-[checked=true]:shadow-[0_0.08em_0.15em_-0.1em_rgba(0,0,0,0.7)_inset,0_0.05em_0.08em_-0.01em_rgba(255,255,255,0.15),-7.25em_0_0_-0.25em_rgba(0,0,0,0.3)]"
					data-checked={checked}
				/>
			</label>
		</div>
	);
}

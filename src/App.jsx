import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import "./index.scss";

const socket = io(window.location.origin);
const BUTTONS = [
	{ name: 'hearth', color: '#762341', image_variants: ['1', '2', '3'], sound_variants: ['1', '2', '3', '4', '5'] },
	{ name: 'truck', color: '#4d5e85', image_variants: ['1', '2', '3'], sound_variants: ['1', '2', '3', '4', '5', '6'] },
	{ name: 'fuck', color: '#6e1409', image_variants: ['1', '2', '3'], sound_variants: ['1', '2', '3'] }
]


export default function App() {
	const { roomId } = useParams();
	const currentRoom = roomId || "default";
	
	const [animations, setAnimations] = useState([]);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(true);
	const [systemMessage, setSystemMessage] = useState({type: 'success', text: '🟠 connexion'});
	const [userCount, setUserCount] = useState(0);
	const volumeRef = useRef(volume);
	const mutedRef = useRef(muted);

	const audios = useRef([]);

	useEffect(() => {
		socket.emit("join-room", currentRoom);
		socket.on("system-message", (msg) => setSystemMessage(msg));
		socket.on("user-count", (count) => setUserCount(count));

		socket.on("play-event", ({ name, sender }) => {
			const BTN = name ? BUTTONS.find((button) => button.name == name) : BUTTONS[0]
			const isSelf = sender === socket.id;
			if (!isSelf) playSound(name, getVariant(BTN.sound_variants), volume, muted);
			triggerAnimation(name, getVariant(BTN.image_variants), isSelf);
		});
		
		return () => socket.off();
	}, [currentRoom]);

	const handleClick = (name) => {
		socket.emit("button-pressed", { room: currentRoom, name, sender: socket.id });
	};

	const getVariant = (variants) => variants[Math.floor(Math.random() * variants.length)]
	
	const playSound = (name, variant) => {
		const audio = new Audio(`/sounds/${name}/${variant}.mp3`);
		audio.volume = mutedRef.current ? 0 : volumeRef.current;
		console.log(volume, muted, mutedRef.current, volumeRef.current, '!')
		audios.current.push(audio);
		audio.play();
		audio.onended = () => {
			audios.current = audios.current.filter(a => a !== audio);
		}
	};

	const triggerAnimation = (name, variant, isSelf) => {
		const id = Date.now();

		const distance = 40;
		const angle = Math.random() * 60 - 30;
		const rad = (angle * Math.PI) / 180;
		const y = -distance * Math.cos(rad);
		const x = distance * Math.sin(rad);

		setAnimations((prev) => [...prev, { id, name, variant, angle, x, y, hue_rotate: Math.random() * 60 - 30, translate: false, self: isSelf }]);

		setTimeout(() => {
			setAnimations((prev) => prev.map((a) => { if (a.id == id) { a.translate = true; } return a; }));
		}, 10);

		setTimeout(() => {
			setAnimations((prev) => prev.filter((a) => a.id !== id));
		}, 800);
	};

	useEffect(() => { volumeRef.current = volume; }, [volume]);
	useEffect(() => { mutedRef.current = muted; }, [muted]);

	useEffect(()=>{
		audios.current.forEach(a => a.volume = muted ? 0 : volume);
	}, [volume, muted])


	return (
		<>
			<div className="volume-control">
				<button onClick={() => setMuted(!muted)}>
					{muted||volume == 0 ? '🔈' : (volume < 0.5 ? '🔉' : '🔊')}
				</button>
				<input
					type="range"
					min="0"
					max="100"
					disabled={muted}
					value={volume * 100}
					onChange={(e) => {setMuted(false); setVolume(Number(e.target.value) / 100)}}
				/>
				{muted ? '0' : Math.round(100*volume)}
			</div>

			<div className="user-count">
				<span className="icon">👥</span> {userCount} connecté{userCount > 1 ? "s" : ""}
			</div>

			{systemMessage && (
				<div className={`system-message ${systemMessage.type}`}>
					{systemMessage.text}
				</div>
			)}

			<div className="animation-container">
				{animations.map((animation) => (
					<div
						key={animation.id}
						className={`animation`}
						style={{
							transform: animation.translate ? `translate(${animation.x}%, ${animation.y}%) rotate(${animation.angle}deg)` : 'translate(0%, 50%) rotate(0deg)',
							filter: animation.self ? `brightness(60%) grayscale(100%)` : `hue-rotate(${animation.hue_rotate}deg)`
						}}
					>
						<img src={`/images/${animation.name}/${animation.variant}.svg`} />
					</div>
				))}
			</div>

			<div className="buttons">
				{BUTTONS.map((button) => (
					<button
						key={button.name}
						className="round-btn"
						style={{ color: button.color }}
						onClick={() => handleClick(button.name,)}
					>
						<img src={`/images/${button.name}/1.svg`} />
					</button>
				))}
			</div>
		</>
	);
}

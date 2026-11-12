import Icon from "./Icon";

export default function HtmlView({ html, onClear }) {
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="panel-head">
        <span className="panel-title">
          <Icon name="terminal" size={14} />
          CONSOLE
        </span>
        <button onClick={onClear} className="btn btn-ghost btn-sm">
          <Icon name="eraser" size={14} />
          Effacer
        </button>
      </div>

      {html ? (
        <iframe
          title="Aperçu HTML"
          sandbox="allow-scripts"
          srcDoc={html}
          className="h-full w-full flex-1 border-0 bg-white"
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--text-faint)]">
          <Icon name="play" size={20} />
          <p>
            Lancez votre code avec <span className="kbd">⌘↵</span> pour voir
            l'aperçu ici.
          </p>
        </div>
      )}
    </div>
  );
}

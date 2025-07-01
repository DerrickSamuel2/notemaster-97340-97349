import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * Modern, minimal Notes App
 * - Create, view, edit, and delete notes
 * - Card-based, responsive layout
 * - Light theme with primary (#007bff), secondary (#6c757d), accent (#ffc107)
 */

// -- Helper: Simple persistent storage (localStorage) --
const STORAGE_KEY = "notes-app-v1";

/**
 * Load notes from localStorage.
 */
function loadNotes() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized ? JSON.parse(serialized) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Save notes to localStorage.
 * @param {Array} notes
 */
function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Generate a quick random id.
 */
function uuid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substr(2, 5)
  );
}

// PUBLIC_INTERFACE
function App() {
  // Notes state and editing/creation state
  const [notes, setNotes] = useState(() => loadNotes());
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [editor, setEditor] = useState({ title: "", content: "" });
  const [mode, setMode] = useState("view"); // view | create | edit
  const titleInput = useRef();

  // Theme (light only for now, but can be future proof for dark)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Save to localStorage whenever notes change
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // On opening creation or edit, focus the title input
  useEffect(() => {
    if ((mode === "create" || mode === "edit") && titleInput.current) {
      titleInput.current.focus();
    }
  }, [mode]);

  // Select note by id (for viewing)
  function selectNote(noteId) {
    setSelectedNoteId(noteId);
    setMode("view");
    const note = notes.find((n) => n.id === noteId);
    if (!note) setEditor({ title: "", content: "" });
    else setEditor({ title: note.title, content: note.content });
  }

  // PUBLIC_INTERFACE
  function startCreate() {
    setEditor({ title: "", content: "" });
    setSelectedNoteId(null);
    setMode("create");
  }

  // PUBLIC_INTERFACE
  function startEdit(noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    setEditor({ title: note.title, content: note.content });
    setSelectedNoteId(noteId);
    setMode("edit");
  }

  // PUBLIC_INTERFACE
  function handleEditorChange(e) {
    const { name, value } = e.target;
    setEditor((e_) => ({ ...e_, [name]: value }));
  }

  // PUBLIC_INTERFACE
  function handleSave(e) {
    e.preventDefault();
    if (!editor.title.trim() && !editor.content.trim()) return;
    if (mode === "create") {
      const note = {
        id: uuid(),
        title: editor.title.trim(),
        content: editor.content.trim(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      setNotes([note, ...notes]);
      setSelectedNoteId(note.id);
      setMode("view");
    } else if (mode === "edit" && selectedNoteId) {
      setNotes(
        notes.map((n) =>
          n.id === selectedNoteId
            ? {
                ...n,
                title: editor.title.trim(),
                content: editor.content.trim(),
                updated: new Date().toISOString(),
              }
            : n
        )
      );
      setMode("view");
    }
  }

  // PUBLIC_INTERFACE
  function handleDelete(noteId) {
    if (
      window.confirm("Delete this note? This cannot be undone.")
    ) {
      setNotes(notes.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        setEditor({ title: "", content: "" });
        setMode("view");
      }
    }
  }

  // Get current note
  const currentNote = notes.find((n) => n.id === selectedNoteId);

  // -- Layout rendering below --
  return (
    <div className="notes-app">
      <header className="notes-header">
        <span className="app-title">📝 Minimal Notes</span>
        <button
          className="accent"
          onClick={startCreate}
          aria-label="Create note"
          style={{ marginLeft: "auto" }}
        >
          + New Note
        </button>
      </header>
      <div className="notes-main">
        {/* List sidebar */}
        <aside className="notes-list-column">
          <div className="notes-list">
            {notes.length === 0 && (
              <div className="empty-state">
                <span>No notes yet.</span>
                <button className="accent" onClick={startCreate}>
                  Create your first note
                </button>
              </div>
            )}
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                active={note.id === selectedNoteId}
                onClick={() => selectNote(note.id)}
                onEdit={() => startEdit(note.id)}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </div>
        </aside>
        {/* Note content/editor */}
        <section className="note-content-section">
          {mode === "view" && currentNote && (
            <ViewNote
              note={currentNote}
              onEdit={() => startEdit(currentNote.id)}
              onDelete={() => handleDelete(currentNote.id)}
            />
          )}
          {mode === "create" && (
            <NoteEditor
              refTitle={titleInput}
              editor={editor}
              onChange={handleEditorChange}
              onSave={handleSave}
              onCancel={() => {
                setMode("view");
                setEditor({ title: "", content: "" });
              }}
              isEdit={false}
            />
          )}
          {mode === "edit" && (
            <NoteEditor
              refTitle={titleInput}
              editor={editor}
              onChange={handleEditorChange}
              onSave={handleSave}
              onCancel={() => {
                setMode("view");
                setEditor({
                  title: currentNote?.title ?? "",
                  content: currentNote?.content ?? "",
                });
              }}
              isEdit={true}
            />
          )}
          {!currentNote && mode === "view" && (
            <div className="empty-state center">
              <span>Select a note to view.</span>
            </div>
          )}
        </section>
      </div>
      <footer className="notes-footer">
        <span>
          Minimal Notes &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteCard({ note, active, onClick, onEdit, onDelete }) {
  return (
    <div
      className={`note-card${active ? " active" : ""}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Open note: ${note.title || "Untitled"}`}
    >
      <div className="note-card-title">
        {note.title ? (
          <>{note.title}</>
        ) : (
          <span className="note-placeholder">(Untitled)</span>
        )}
      </div>
      <div className="note-card-actions">
        <button
          className="secondary"
          title="Edit note"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          ✏️
        </button>
        <button
          className="danger"
          title="Delete note"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function ViewNote({ note, onEdit, onDelete }) {
  return (
    <div className="view-note-card">
      <div className="view-note-header">
        <h2>
          {note.title ? note.title : <span className="note-placeholder">(Untitled)</span>}
        </h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5em" }}>
          <button className="secondary" onClick={onEdit}>
            Edit
          </button>
          <button className="danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="view-note-content">
        {note.content
          ? note.content.split("\n").map((l, i) => <p key={i}>{l}</p>)
          : <span className="note-placeholder">(No content)</span>}
      </div>
      <div className="view-note-meta">
        <span>
          Created:{" "}
          {note.created
            ? new Date(note.created).toLocaleString()
            : "?"}
        </span>
        <span style={{ marginLeft: "1em" }}>
          Updated:{" "}
          {note.updated
            ? new Date(note.updated).toLocaleString()
            : "?"}
        </span>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({
  refTitle,
  editor,
  onChange,
  onSave,
  onCancel,
  isEdit,
}) {
  return (
    <form className="note-editor-card" onSubmit={onSave} autoComplete="off">
      <h2 style={{ marginBottom: "0.5em" }}>
        {isEdit ? "Edit Note" : "New Note"}
      </h2>
      <input
        name="title"
        value={editor.title}
        ref={refTitle}
        onChange={onChange}
        className="note-input"
        placeholder="Title"
        maxLength={120}
        autoFocus
        spellCheck={true}
        required={false}
      />
      <textarea
        name="content"
        value={editor.content}
        onChange={onChange}
        className="note-textarea"
        placeholder="Write your note..."
        rows={10}
        maxLength={2000}
        style={{ resize: "vertical" }}
        spellCheck={true}
      />
      <div className="note-editor-actions">
        <button type="submit" className="primary">
          {isEdit ? "Save changes" : "Add note"}
        </button>
        <button
          className="secondary"
          type="button"
          onClick={onCancel}
          style={{ marginLeft: "1em" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default App;

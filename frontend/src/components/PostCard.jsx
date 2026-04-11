import { Link } from "react-router-dom";

function displayName(user) {
  return user?.profile?.display_name?.trim() || user?.username;
}

export default function PostCard({ post, currentUsername, onEdit, showAuthor = true }) {
  const author = post.author;
  const isOwner = currentUsername && author?.username === currentUsername;

  return (
    <article className="card">
      <div className="row">
        {author?.profile?.avatar ? (
          <img
            src={author.profile.avatar}
            alt=""
            className="avatar"
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <div className="avatar" aria-hidden />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {showAuthor && (
            <div>
              <Link to={`/u/${author.username}`}>
                <strong>{displayName(author)}</strong>
              </Link>{" "}
              <span className="muted">@{author.username}</span>
            </div>
          )}
          <p style={{ margin: "0.35rem 0", whiteSpace: "pre-wrap" }}>
            {post.content}
          </p>
          <div className="muted">
            <Link to={`/post/${post.id}`}>Ver post</Link>
            {post.updated_at &&
            post.created_at &&
            post.updated_at !== post.created_at ? (
              <span> · editado</span>
            ) : null}
            {isOwner && onEdit ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "0.1rem 0.5rem", fontSize: "0.85rem" }}
                  onClick={() => onEdit(post)}
                >
                  Editar
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

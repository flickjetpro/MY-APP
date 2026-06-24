export default function Footer() {
  return (
    <footer className="footer footer-center p-6 bg-base-300 text-base-content mt-8">
      <div>
        <p className="text-sm opacity-60">
          TV App &copy; {new Date().getFullYear()} &mdash; Streaming links sourced from IPTV-org.
          For educational purposes only.
        </p>
      </div>
    </footer>
  )
}

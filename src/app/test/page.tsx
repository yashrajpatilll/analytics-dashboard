export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">
        Analytics Dashboard Test Page
      </h1>
      <p className="mt-4 text-gray-600">
        If you can see this, Next.js is working correctly.
      </p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
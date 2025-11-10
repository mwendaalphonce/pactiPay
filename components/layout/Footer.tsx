import { Badge } from "../ui/badge";

export default function Footer() {
    return (
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              <p>© 2025 Pacti. Built with compliance to Kenyan labor laws.</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                Support
              </a>
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    )
  }
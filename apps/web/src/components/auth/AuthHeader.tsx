import React from 'react'
import { Link } from 'react-router-dom'

interface AuthHeaderProps {
  heading: string
  paragraph: string
  linkName: string
  linkUrl: string
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  heading,
  paragraph,
  linkName,
  linkUrl,
}) => {
  return (
    <div className="mb-10">
      <div className="flex justify-center">
        <img
          alt="Logo"
          className="h-14 w-14"
          src="/logo.png"
        />
      </div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {heading}
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        {paragraph}{" "}
        <Link
          to={linkUrl}
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          {linkName}
        </Link>
      </p>
    </div>
  )
}

export default AuthHeader

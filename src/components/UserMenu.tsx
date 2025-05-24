'use client';

import { Fragment } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';

export default function UserMenu() {
  const { data: session } = useSession();

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex text-sm bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
          <span className="sr-only">Open user menu</span>
          {session.user.image ? (
            <img
              className="h-8 w-8 rounded-full"
              src={session.user.image}
              alt={session.user.name || 'User'}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{session.user.name}</div>
            <div className="text-xs text-gray-500">{session.user.email}</div>
            <div className="text-xs">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                session.user.subscription.tier === 'free' ? 'bg-gray-100 text-gray-800' :
                session.user.subscription.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {session.user.subscription.tier.charAt(0).toUpperCase() + session.user.subscription.tier.slice(1)}
              </span>
            </div>
          </div>

          <Menu.Item>
            {({ active }) => (
              <Link
                href="/dashboard"
                className={`${
                  active ? 'bg-gray-100' : ''
                } block px-4 py-2 text-sm text-gray-700`}
              >
                Dashboard
              </Link>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <Link
                href="/dashboard/profile"
                className={`${
                  active ? 'bg-gray-100' : ''
                } block px-4 py-2 text-sm text-gray-700`}
              >
                Profile Settings
              </Link>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <Link
                href="/dashboard/billing"
                className={`${
                  active ? 'bg-gray-100' : ''
                } block px-4 py-2 text-sm text-gray-700`}
              >
                Billing & Plans
              </Link>
            )}
          </Menu.Item>

          {session.user.role === 'admin' && (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/admin"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block px-4 py-2 text-sm text-gray-700`}
                >
                  Admin Panel
                </Link>
              )}
            </Menu.Item>
          )}

          <div className="border-t">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                >
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

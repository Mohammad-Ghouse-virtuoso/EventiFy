    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/middleware/base.py", line 191, in __call__
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/middleware/base.py", line 168, in call_next
    with recv_stream, send_stream, collapse_excgroups():
    raise app_exc from app_exc.__cause__ or app_exc.__context__
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/middleware/base.py", line 144, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/middleware/cors.py", line 93, in __call__
    await self.simple_response(scope, receive, send, request_headers=headers)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/middleware/cors.py", line 144, in simple_response
    await self.app(scope, receive, send)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
    await self.app(scope, receive, send)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/routing.py", line 716, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/routing.py", line 736, in app
    await route.handle(scope, receive, send)
    return await dependant.call(**values)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/starlette/routing.py", line 290, in handle
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/fastapi/routing.py", line 101, in app
    await self.app(scope, receive, send)
    response = await f(request)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/fastapi/routing.py", line 115, in app
               ^^^^^^^^^^^^^^^^
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/fastapi/routing.py", line 355, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<3 lines>...
    )
    ^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/fastapi/routing.py", line 243, in run_endpoint_function
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/app/backend/app/api/api_v1/endpoints/stats.py", line 126, in get_recent_activity
    recent_rsvps = session.exec(
                   ~~~~~~~~~~~~^
        select(RSVP, User, Event)
        ^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<7 lines>...
        .limit(limit)
        ^^^^^^^^^^^^^
    ).all()
    ^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlmodel/orm/session.py", line 81, in exec
    results = super().execute(
        statement,
    ...<4 lines>...
        _add_event=_add_event,
    )
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/orm/session.py", line 2351, in execute
    return self._execute_internal(
           ~~~~~~~~~~~~~~~~~~~~~~^
        statement,
        ^^^^^^^^^^
    ...<4 lines>...
        _add_event=_add_event,
        ^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/orm/session.py", line 2249, in _execute_internal
    result: Result[Any] = compile_state_cls.orm_execute_statement(
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self,
        ^^^^^
    ...<4 lines>...
        conn,
        ^^^^^
    )
    ^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/orm/context.py", line 306, in orm_execute_statement
    result = conn.execute(
        statement, params or {}, execution_options=execution_options
    )
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/engine/base.py", line 1419, in execute
    return meth(
        self,
        distilled_parameters,
        execution_options or NO_OPTIONS,
    )
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/sql/elements.py", line 527, in _execute_on_connection
    return connection._execute_clauseelement(
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self, distilled_params, execution_options
    )
    ^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/engine/base.py", line 1846, in _execute_context
    return self._exec_single_context(
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/engine/base.py", line 2363, in _handle_dbapi_exception
           ~~~~~~~~~~~~~~~~~~~~~~~~~^
        dialect, context, statement, parameters
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/mise/installs/python/3.13.11/lib/python3.13/site-packages/sqlalchemy/engine/base.py", line 1986, in _exec_single_context
    self._handle_dbapi_exception(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        e, str_statement, effective_parameters, cursor, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
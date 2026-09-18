"""Isolated browser regression; never opens production or user storage."""
import functools, http.server, os, pathlib, threading
from playwright.sync_api import sync_playwright
root=pathlib.Path(os.environ.get('MATH_TEST_ROOT',pathlib.Path(__file__).resolve().parent.parent))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root/'dist')))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH',p.chromium.executable_path))
        for width in [390,1280]:
            context=browser.new_context(viewport={'width':width,'height':844})
            page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/#/setup-check')
            inp=page.get_by_placeholder('答えを入力（全角可）')
            inp.fill('');page.get_by_role('button',name='√',exact=True).click()
            assert inp.evaluate('(e)=>[e.value,e.selectionStart]')==['√()',2]
            inp.press('2');assert inp.input_value()=='√(2)'
            inp.fill('0y32');inp.press('Home');inp.press('ArrowRight')
            page.get_by_role('button',name='≦',exact=True).click()
            page.wait_for_function("document.querySelector('.answer-input').selectionStart===2")
            inp.press('ArrowRight');page.get_by_role('button',name='≦',exact=True).click()
            page.wait_for_function("document.querySelector('.answer-input').selectionStart===4")
            assert inp.input_value()=='0≦y≦32',inp.evaluate('(e)=>[e.value,e.selectionStart]')
            inp.press('Home');inp.press('ArrowRight');inp.press('Shift+ArrowRight')
            page.get_by_role('button',name='⌫',exact=True).click();assert inp.input_value()=='0y≦32'
            page.get_by_role('button',name='クリア',exact=True).click();assert inp.input_value()==''
            inp.fill('999999');page.get_by_role('button',name='自動採点する',exact=True).click()
            page.get_by_role('link',name='途中保存してホームへ',exact=True).click()
            page.goto(f'http://127.0.0.1:{server.server_port}/#/setup-check')
            assert inp.input_value()=='999999'
            assert not errors,errors
            context.close()
        browser.close()
    print('PASS mobile/desktop math input: cursor, replacement, deletion, grading and saved draft')
finally: server.shutdown()

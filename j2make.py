#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import signal
import shutil
import pathlib
import jinja2

def postclean( html ):
    html = html.replace( '<!--****************************-->', '' )
    html = html.replace( '<!--*******************************-->', '' )
    html = html.replace( '\t', '' )
    for x in range(0, 20):
        html = html.replace( '  ', ' ' )
    html = html.replace( ' <', '<' )
    html = html.replace( '\n', '' )
    return html

def compileHTML( page ):

    rootPath = pathlib.Path( __file__ ).parent
    savePath = rootPath.joinpath( page+".html" )
    tmpsPath = rootPath.joinpath( "pages" )
    tpmtPath = tmpsPath.joinpath( page+".tmpl" )
    if tpmtPath.exists():
        env = jinja2.Environment(
            loader = jinja2.FileSystemLoader( str( tmpsPath.as_posix()) ),
            autoescape = jinja2.select_autoescape( [ "html" ] ) )
        template = env.get_template( page+".tmpl" )
        html = template.render( )
        html = postclean( html )

        if savePath.exists(): savePath.unlink()
        with open( str( savePath.as_posix() ), 'w' ) as htmlFile:
            htmlFile.write( html )
    return

def main():
    compileHTML( "scanui" )
    compileHTML( "copyui" )
    compileHTML( "printui" )
    return

if __name__ == '__main__':
    main()

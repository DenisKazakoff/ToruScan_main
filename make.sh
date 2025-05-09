#!/usr/bin/env bash

arguments=("$@");
# ******************************************************************
# Functions
# ******************************************************************
function parse_args()
{ # Begin Sub
    local argument;
    for argument in "${arguments[@]}"; do
        if ! [ ${argument:0:2} == "--" ]; then
            printf "Error: The argument should start with '--'\n";
            printf "this value <${argument}> will be ignored\n";
        else
            case ${argument%=*} in
                "--path")       argPath=${argument#*=}; argPath=${argPath#*--} ;;
                "--node")       argNode=${argument#*=}; argNode=${argNode#*--} ;;
                "--reinstall")  argRins="true" ;;
                *) printf "Warn: unknown parameter: ${argument%:*}\n" ;;
            esac
        fi
    done
} #End Sub

function install_items()
{ # Begin Sub

    if ! [ "${subdir}" == "" ]; then

        if ! [ -d "${buildPath}/${subdir}" ]; then
            install -dv "${buildPath}/${subdir}";
        fi

        echo "Install items:";
        for item in ${items[*]}
        do
            echo "item ${item}";
            if [ -f "${basedir}/${subdir}/${item}${ext}" ]; then
                cp -uv "${basedir}/${subdir}/${item}${ext}" \
                "${buildPath}/${subdir}/${item}${ext}";
            fi
        done

        folders=(); idx=0;
        while read folder
        do
            if [ -d "${basedir}/${subdir}/${folder}" ]; then
                folders+=( ${folder} );
            fi
            (( idx++ ));
        done < <( ls "${basedir}/${subdir}");

        for folder in ${folders[*]}
        do

            if ! [ -d "${buildPath}/${subdir}/${folder}" ]; then
                install -dv "${buildPath}/${subdir}/${folder}";
            fi

            for item in ${items[*]}
            do
                if [ -f "./${subdir}/${folder}/${item}${ext}" ]; then
                    cp -uv "${basedir}/${subdir}/${folder}/${item}${ext}" \
                    "${buildPath}/${subdir}/${folder}/${item}${ext}";
                fi
            done
        done

    else
        for item in ${items[*]}
        do
            if [ -f "${basedir}/${item}${ext}" ]; then
                cp -uv "${basedir}/${item}${ext}" \
                "${buildPath}/${item}${ext}";
            fi
        done
    fi
} #End Sub

# ******************************************************************
# Main Code
# ******************************************************************
#Get basedir
basedir="$(dirname `readlink -f $0`)";

# Convert icons to Base64
fpath="${basedir}/pages/icons";
files="$( ls ${fpath} | grep -e .svg )";
for fname in $files; do
    fbase="${fpath}/${fname%.*}";
    if ! [ -f "${fbase}.png" ]; then
        gm convert -resize 96x96 -background none \
        "${fbase}.svg" "${fbase}.png";
    fi

    if ! [ -f "${fbase}.b64" ]; then
        echo "data:image/png;base64," > "${fbase}.b64";
        openssl enc -base64 \
        -in "${fbase}.png" >> "${fbase}.b64";
    fi
done

# Convert images to Base64
fpath="${basedir}/pages/images";
files="$( ls ${fpath} )";
for fname in $files; do
    fbase="${fpath}/${fname%.*}";
    fext="${fname##*.}"
    if ! [ -f "${fbase}.b64" ]; then
        echo "data:image/${fext};base64," > "${fbase}.b64";
        openssl enc -base64 \
            -in "${fbase}.${fext}" >> "${fbase}.b64";
    fi
done

# Build HTML pages
python3 "${basedir}/j2make.py";
# Process paths
parse_args;
if [ -z "${argPath}" ]; then
    buildPath="${basedir}/build";
else
    buildPath="${argPath}";
fi

if [ "${argRins}" == "true" ]; then
    rm -Rv "${buildPath}";
fi

if ! [ -d "${buildPath}" ]; then
    install -dv "${buildPath}";
fi

# install node
if [ "${argNode}" == "local" ] || [ "${argNode}" == "" ]; then
    if ! [ -d "${buildPath}/node" ]; then
        cp -Ruv "${basedir}/node" "${buildPath}/node";
    fi

    if ! [ -d "${buildPath}/node_modules" ]; then
        cp -Ruv "${basedir}/node_modules" "${buildPath}/node_modules";
    fi

    if ! [ -f "${buildPath}/package.json" ]; then
        cp -uv "${basedir}/package.json" "${buildPath}/package.json";
    fi

    if ! [ -f "${buildPath}/package-lock.json" ]; then
        cp -uv "${basedir}/package-lock.json" "${buildPath}/package-lock.json";
    fi
else
    if [ -d "${argNode}/node" ]; then
        ln -svf "${argNode}/node" "${buildPath}/node";
        ln -svf "${argNode}/node_modules" "${buildPath}/node_modules";
        ln -svf "${argNode}/package.json" "${buildPath}/package.json";
        ln -svf "${argNode}/package-lock.json" "${buildPath}/package-lock.json";
    else
        printf "Error: The path to the Node.js is specified incorrectly\n";
    fi
fi

#install scan driver
subdir="drivers";
items=( "TORUScan" "conv.lib" "scan.lib" );
ext="";
install_items;

#install print driver
subdir="drivers";
items=( );
ext="";
install_items;

#install pages
subdir="";
items=( "scanui" "printui" "copyui" );
ext=".html";
install_items;

#install java
subdir="";
items+=( "main" "preload" );
ext=".js";
install_items;

#install config
subdir="config";
cp -Ruv "${basedir}/${subdir}" "${buildPath}";

#install locales
subdir="locales";
cp -Ruv "${basedir}/${subdir}" "${buildPath}";

#install theme
subdir="theme";
cp -Ruv "${basedir}/${subdir}" "${buildPath}";

#install tools
subdir="tools";
cp -Ruv "${basedir}/${subdir}" "${buildPath}";

#install launcher
launcher="${buildPath}/launcher";
rm -v "${launcher}";
#touch "${launcher}";
#echo "#!/bin/env bash" >> "${launcher}";
#echo "OLDPATH=\${PATH};" >> "${launcher}";
#echo "NODE=${buildPath}/node/bin;" >> "${launcher}";
#echo "export PATH=\${NODE}:\${OLDPATH};" >> "${launcher}";
#echo "cd ${buildPath};" >> "${launcher}";
#echo "npm start;" >> "${launcher}";
#echo "export PATH=\${OLDPATH};" >> "${launcher}";
cp -uv "${basedir}/launcher" "${buildPath}";
chmod u+x,g+x,o+x "${launcher}";

#install desktop link
desktop="${HOME}/.local/share/applications/TORUSuite.desktop";
rm -v "${desktop}";
touch "${desktop}";
echo "[Desktop Entry]" >> "${desktop}";
echo "Type=Application" >> "${desktop}";
echo "Name=TORUSuite" >> "${desktop}";
echo "Exec=${buildPath}/launcher" >> "${desktop}";
echo "Icon=${buildPath}/theme/icon.png" >> "${desktop}";
echo "Terminal=false" >> "${desktop}";
